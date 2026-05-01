import { InventoryService } from '../../src/services/inventoryService';
import { Database } from '../../src/database/connection';
import { PoolClient } from 'pg';

// Mock Database
jest.mock('../../src/database/connection');

describe('InventoryService', () => {
  let service: InventoryService;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryService();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as any;

    // Setup default Database mocks
    (Database.transaction as jest.Mock) = jest.fn();
    (Database.query as jest.Mock) = jest.fn();
  });

  describe('createReceipt', () => {
    it('should create a receipt with items successfully', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const result = await callback(mockClient);
        return result;
      });

      (Database.transaction as jest.Mock) = mockTransaction;

      const receiptData = {
        id: 'receipt-1',
        receipt_number: 'REC001',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        notes: 'Test receipt',
        created_by: 'User1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const itemsData = [
        {
          id: 'item-1',
          receipt_id: 'receipt-1',
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          total_price: 1000,
          batch_number: 'BATCH001',
          expiration_date: '2025-01-15',
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      // Mock client queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [receiptData] })
        .mockResolvedValueOnce({ rows:[productData]})// Insert receipt
        .mockResolvedValueOnce({ rows: [itemsData[0]] }); // Insert item

      const request = {
        receipt_number: 'REC001',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        notes: 'Test receipt',
        created_by: 'User1',
        items: [
          {
            product_id: 'PROD001',
            product_name: 'Product 1',
            quantity: 10,
            unit: 'box',
            unit_price: 100,
            batch_number: 'BATCH001',
            expiration_date: '2025-01-15',
          },
        ],
      };

      const result = await service.createReceipt(request);

      expect(result.receipt).toEqual(receiptData);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_id).toBe('PROD001');
    });

    it('should throw error if receipt_number already exists (DB constraint)', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        // Mock the transaction to throw unique constraint violation
        throw new Error('duplicate key value violates unique constraint "inventory_receipts_receipt_number_key" (23505)');
      });

      (Database.transaction as jest.Mock) = mockTransaction;

      const request = {
        receipt_number: 'REC001',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        items: [
          {
            product_id: 'PROD001',
            product_name: 'Product 1',
            quantity: 10,
            unit: 'box',
            unit_price: 100,
          },
        ],
      };

      await expect(service.createReceipt(request)).rejects.toThrow();
    });
  });

  describe('getReceiptById', () => {
    it('should return receipt with items', async () => {
      const receiptData = {
        id: 'receipt-1',
        receipt_number: 'REC001',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        notes: 'Test receipt',
        created_by: 'User1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const itemsData = [
        {
          id: 'item-1',
          receipt_id: 'receipt-1',
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          total_price: 1000,
          batch_number: 'BATCH001',
          expiration_date: '2025-01-15',
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      (Database.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [receiptData] })
        .mockResolvedValueOnce({ rows: itemsData });

      const result = await service.getReceiptById('receipt-1');

      expect(result).not.toBeNull();
      expect(result?.receipt).toEqual(receiptData);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].product_name).toBe('Product 1');
    });

    it('should return null if receipt not found', async () => {
      (Database.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getReceiptById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listReceipts', () => {
    it('should return paginated list of receipts', async () => {
      const receiptsData = [
        {
          id: 'receipt-1',
          receipt_number: 'REC001',
          warehouse_id: 'WH001',
          supplier_id: 'SUP001',
          receipt_date: '2024-01-15',
          notes: null,
          created_by: 'User1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      (Database.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: 5 }] })
        .mockResolvedValueOnce({ rows: receiptsData });

      const result = await service.listReceipts(1, 10);

      expect(result.receipts).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.receipts[0].receipt_number).toBe('REC001');
    });

    it('should apply filters correctly', async () => {
      const receiptsData = [
        {
          id: 'receipt-1',
          receipt_number: 'REC001',
          warehouse_id: 'WH001',
          supplier_id: 'SUP001',
          receipt_date: '2024-01-15',
          notes: null,
          created_by: 'User1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      (Database.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: receiptsData });

      const result = await service.listReceipts(1, 10, {
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
      });

      expect(result.total).toBe(1);
      expect(result.receipts[0].warehouse_id).toBe('WH001');
    });
  });

  describe('getReceiptItems', () => {
    it('should return items for a receipt', async () => {
      const itemsData = [
        {
          id: 'item-1',
          receipt_id: 'receipt-1',
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          total_price: 1000,
          batch_number: 'BATCH001',
          expiration_date: '2025-01-15',
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      (Database.query as jest.Mock).mockResolvedValueOnce({ rows: itemsData });

      const result = await service.getReceiptItems('receipt-1');

      expect(result).toHaveLength(1);
      expect(result[0].product_id).toBe('PROD001');
      expect(result[0].quantity).toBe(10);
    });
  });
});
