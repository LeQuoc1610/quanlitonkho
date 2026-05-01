import { PoolClient } from 'pg';
import { Database } from '../database/connection';
import {
  InventoryReceipt,
  InventoryReceiptItem,
  CreateReceiptRequest,
  UpdateReceiptRequest,
  ReceiptWithItems,
} from '../models/types';

export class InventoryService {
  async createReceipt(request: CreateReceiptRequest): Promise<ReceiptWithItems> {
    return Database.transaction(async (client: PoolClient) => {
      const receiptResult = await client.query<InventoryReceipt>(
        `INSERT INTO inventory_receipts 
         (receipt_number, warehouse_id, supplier_id, receipt_date, delivery_person_name, warehouse_keeper_name, accountant_name, director_name, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          request.receipt_number,
          request.warehouse_id,
          request.supplier_id,
          request.receipt_date,
          request.delivery_person_name || null,
          request.warehouse_keeper_name,
          request.accountant_name || null,
          request.director_name || null,
          request.notes || null,
          request.created_by || 'SYSTEM',
        ]
      );

      const receipt = receiptResult.rows[0];
      const items: InventoryReceiptItem[] = [];

      for (const item of request.items) {
        const itemResult = await client.query<InventoryReceiptItem>(
          `INSERT INTO inventory_receipt_items
           (receipt_id, product_id, product_name, quantity, unit, unit_price, batch_number, expiration_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            receipt.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit,
            item.unit_price,
            item.batch_number || null,
            item.expiration_date || null,
            item.notes || null,
          ]
        );

        items.push(itemResult.rows[0]);
      }

      return {
        receipt,
        items,
      };
    });
  }

  async updateReceipt(receiptId: string, request: UpdateReceiptRequest): Promise<ReceiptWithItems | null> {
    return Database.transaction(async (client: PoolClient) => {
      const receiptResult = await client.query<InventoryReceipt>(
        `UPDATE inventory_receipts
         SET receipt_number = $1,
             warehouse_id = $2,
             supplier_id = $3,
             receipt_date = $4,
             delivery_person_name = $5,
             warehouse_keeper_name = $6,
             accountant_name = $7,
             director_name = $8,
             notes = $9,
             created_by = $10
         WHERE id = $11
         RETURNING *`,
        [
          request.receipt_number,
          request.warehouse_id,
          request.supplier_id,
          request.receipt_date,
          request.delivery_person_name || null,
          request.warehouse_keeper_name,
          request.accountant_name || null,
          request.director_name || null,
          request.notes || null,
          request.created_by || 'SYSTEM',
          receiptId,
        ]
      );

      if (receiptResult.rows.length === 0) {
        return null;
      }

      const receipt = receiptResult.rows[0];

      await client.query('DELETE FROM inventory_receipt_items WHERE receipt_id = $1', [receiptId]);

      const items: InventoryReceiptItem[] = [];
      for (const item of request.items) {
        const itemResult = await client.query<InventoryReceiptItem>(
          `INSERT INTO inventory_receipt_items
           (receipt_id, product_id, product_name, quantity, unit, unit_price, batch_number, expiration_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            receipt.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit,
            item.unit_price,
            item.batch_number || null,
            item.expiration_date || null,
            item.notes || null,
          ]
        );

        items.push(itemResult.rows[0]);
      }

      return {
        receipt,
        items,
      };
    });
  }

  async deleteReceipt(receiptId: string): Promise<boolean> {
    return Database.transaction(async (client: PoolClient) => {
      await client.query('DELETE FROM inventory_receipt_items WHERE receipt_id = $1', [receiptId]);
      const deleteResult = await client.query('DELETE FROM inventory_receipts WHERE id = $1', [receiptId]);
      return (deleteResult.rowCount ?? 0) > 0;
    });
  }

  async getReceiptById(receiptId: string): Promise<ReceiptWithItems | null> {
    const receiptResult = await Database.query<InventoryReceipt>(
      'SELECT * FROM inventory_receipts WHERE id = $1',
      [receiptId]
    );

    if (receiptResult.rows.length === 0) {
      return null;
    }

    const receipt = receiptResult.rows[0];

    const itemsResult = await Database.query<InventoryReceiptItem>(
      'SELECT * FROM inventory_receipt_items WHERE receipt_id = $1 ORDER BY created_at',
      [receiptId]
    );

    return {
      receipt,
      items: itemsResult.rows,
    };
  }

  async listReceipts(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      warehouse_id?: string;
      supplier_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ receipts: InventoryReceipt[]; total: number }> {
    let query = 'SELECT * FROM inventory_receipts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.warehouse_id) {
      query += ` AND warehouse_id ILIKE $${paramIndex}`;
      params.push(`%${filters.warehouse_id}%`);
      paramIndex++;
    }

    if (filters?.supplier_id) {
      query += ` AND supplier_id ILIKE $${paramIndex}`;
      params.push(`%${filters.supplier_id}%`);
      paramIndex++;
    }

    if (filters?.start_date) {
      query += ` AND receipt_date >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND receipt_date <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    const countResult = await Database.query<{ count: string }>(  
      `SELECT COUNT(*)::int AS count FROM (${query}) as t`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (page - 1) * pageSize;
    query += ` ORDER BY receipt_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await Database.query<InventoryReceipt>(query, params);

    return {
      receipts: result.rows,
      total,
    };
  }

  async getReceiptItems(receiptId: string): Promise<InventoryReceiptItem[]> {
    const result = await Database.query<InventoryReceiptItem>(
      'SELECT * FROM inventory_receipt_items WHERE receipt_id = $1 ORDER BY created_at',
      [receiptId]
    );

    return result.rows;
  }
}

export const inventoryService = new InventoryService();
