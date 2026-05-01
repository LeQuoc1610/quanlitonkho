jest.mock('../../dist/database/connection', () => ({
  Database: {
    transaction: jest.fn(),
    query: jest.fn(),
  },
}));

const { InventoryService } = require('../../dist/services/inventoryService');
const { Database } = require('../../dist/database/connection');

describe('InventoryService', () => {
  let service;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryService();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
  });

  it('creates a receipt with items', async () => {
    Database.transaction.mockImplementation(async (callback) => callback(mockClient));

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'receipt-1',
            receipt_number: 'REC001',
            warehouse_id: 'WH001',
            supplier_id: 'SUP001',
            receipt_date: '2024-01-15',
            notes: 'Test receipt',
            created_by: 'User1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
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
        ],
      });

    const result = await service.createReceipt({
      receipt_number: 'REC001',
      warehouse_id: 'WH001',
      supplier_id: 'SUP001',
      receipt_date: '2024-01-15',
      warehouse_keeper_name: 'Keeper1',
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
    });

    expect(result.receipt.receipt_number).toBe('REC001');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].product_id).toBe('PROD001');
  });

  it('returns null when a receipt is not found', async () => {
    Database.query.mockResolvedValueOnce({ rows: [] });

    const result = await service.getReceiptById('missing');

    expect(result).toBeNull();
  });

  it('lists receipts with filters and pagination', async () => {
    Database.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({
        rows: [
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
        ],
      });

    const result = await service.listReceipts(1, 10, { warehouse_id: 'WH001' });

    expect(result.total).toBe(2);
    expect(result.receipts).toHaveLength(1);
  });

  it('returns receipt items', async () => {
    Database.query.mockResolvedValueOnce({
      rows: [
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
      ],
    });

    const result = await service.getReceiptItems('receipt-1');

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe('PROD001');
  });
});
