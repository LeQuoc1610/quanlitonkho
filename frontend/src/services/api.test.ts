import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptFormData, ReceiptItemFormData } from '../types';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const getInventoryApi = async () => {
  vi.resetModules();
  const mod = await import('./api');
  return mod.inventoryApi;
};

describe('InventoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create = vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any));
  });

  describe('createReceipt', () => {
    it('should create a receipt successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Receipt created successfully',
          data: {
            receipt: {
              id: 'receipt-1',
              receipt_number: 'PN2401-1234',
              warehouse_id: 'WH001',
              supplier_id: 'SUP001',
              receipt_date: '2024-01-15',
              warehouse_keeper_name: 'John Doe',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            items: [
              {
                id: 'item-1',
                receipt_id: 'receipt-1',
                product_id: 'PROD001',
                product_name: 'Product 1',
                quantity: 10,
                unit: 'box',
                unit_price: 100,
                total_price: 1000,
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
              },
            ],
          },
        },
      };

      const receiptData: ReceiptFormData = {
        receipt_number: 'PN2401-1234',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        delivery_person_name: '',
        warehouse_keeper_name: 'John Doe',
        accountant_name: '',
        director_name: '',
        notes: '',
      };

      const items: ReceiptItemFormData[] = [
        {
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          batch_number: '',
          expiration_date: '',
          notes: '',
        },
      ];

      const mockAxiosInstance = {
        post: vi.fn().mockResolvedValue(mockResponse),
        get: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const api = await getInventoryApi();
      const result = await api.createReceipt(receiptData, items);

      expect(result.success).toBe(true);
      expect(result.data?.receipt.id).toBe('receipt-1');
      expect(result.data?.items).toHaveLength(1);
    });

    it('should handle 409 conflict error for duplicate receipt number', async () => {
      const mockError = {
        response: {
          status: 409,
          data: { error: 'Receipt number already exists' },
        },
      };

      const receiptData: ReceiptFormData = {
        receipt_number: 'PN2401-1234',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        delivery_person_name: '',
        warehouse_keeper_name: 'John Doe',
        accountant_name: '',
        director_name: '',
        notes: '',
      };

      const items: ReceiptItemFormData[] = [
        {
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          batch_number: '',
          expiration_date: '',
          notes: '',
        },
      ];

      const mockAxiosInstance = {
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true) as any;

      const api = await getInventoryApi();
      await expect(api.createReceipt(receiptData, items)).rejects.toThrow(
        'Receipt number already exists'
      );
    });

    it('should handle generic error response', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Failed to create receipt' },
        },
      };

      const receiptData: ReceiptFormData = {
        receipt_number: 'PN2401-1234',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2024-01-15',
        delivery_person_name: '',
        warehouse_keeper_name: 'John Doe',
        accountant_name: '',
        director_name: '',
        notes: '',
      };

      const items: ReceiptItemFormData[] = [
        {
          product_id: 'PROD001',
          product_name: 'Product 1',
          quantity: 10,
          unit: 'box',
          unit_price: 100,
          batch_number: '',
          expiration_date: '',
          notes: '',
        },
      ];

      const mockAxiosInstance = {
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true) as any;

      const api = await getInventoryApi();
      await expect(api.createReceipt(receiptData, items)).rejects.toThrow(
        'Failed to create receipt'
      );
    });
  });

  describe('getReceipt', () => {
    it('should get receipt by id successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            receipt: {
              id: 'receipt-1',
              receipt_number: 'PN2401-1234',
              warehouse_id: 'WH001',
              supplier_id: 'SUP001',
              receipt_date: '2024-01-15',
              warehouse_keeper_name: 'John Doe',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            items: [
              {
                id: 'item-1',
                receipt_id: 'receipt-1',
                product_id: 'PROD001',
                product_name: 'Product 1',
                quantity: 10,
                unit: 'box',
                unit_price: 100,
                total_price: 1000,
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
              },
            ],
          },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const api = await getInventoryApi();
      const result = await api.getReceipt('receipt-1');

      expect(result.success).toBe(true);
      expect(result.data?.receipt.id).toBe('receipt-1');
      expect(result.data?.items).toHaveLength(1);
    });

    it('should handle error when fetching receipt', async () => {
      const mockError = {
        response: {
          data: { error: 'Receipt not found' },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true) as any;

      const api = await getInventoryApi();
      await expect(api.getReceipt('non-existent')).rejects.toThrow('Receipt not found');
    });
  });

  describe('listReceipts', () => {
    it('should list receipts with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            receipts: [
              {
                id: 'receipt-1',
                receipt_number: 'PN2401-1234',
                warehouse_id: 'WH001',
                supplier_id: 'SUP001',
                receipt_date: '2024-01-15',
                warehouse_keeper_name: 'John Doe',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
              },
              {
                id: 'receipt-2',
                receipt_number: 'PN2401-5678',
                warehouse_id: 'WH001',
                supplier_id: 'SUP002',
                receipt_date: '2024-01-16',
                warehouse_keeper_name: 'Jane Smith',
                created_at: '2024-01-16T10:00:00Z',
                updated_at: '2024-01-16T10:00:00Z',
              },
            ],
            total: 2,
            page: 1,
            pageSize: 10,
          },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const api = await getInventoryApi();
      const result = await api.listReceipts(1, 10);

      expect(result.success).toBe(true);
      expect(result.data?.receipts).toHaveLength(2);
      expect(result.data?.total).toBe(2);
    });

    it('should list receipts with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            receipts: [
              {
                id: 'receipt-1',
                receipt_number: 'PN2401-1234',
                warehouse_id: 'WH001',
                supplier_id: 'SUP001',
                receipt_date: '2024-01-15',
                warehouse_keeper_name: 'John Doe',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
              },
            ],
            total: 1,
            page: 1,
            pageSize: 10,
          },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const api = await getInventoryApi();
      const result = await api.listReceipts(1, 10, { warehouse_id: 'WH001' });

      expect(result.success).toBe(true);
      expect(result.data?.receipts).toHaveLength(1);
    });

    it('should handle error when listing receipts', async () => {
      const mockError = {
        response: {
          data: { error: 'Failed to fetch receipts' },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true) as any;

      const api = await getInventoryApi();
      await expect(api.listReceipts()).rejects.toThrow('Failed to fetch receipts');
    });
  });

  describe('getReceiptItems', () => {
    it('should get receipt items successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'item-1',
              receipt_id: 'receipt-1',
              product_id: 'PROD001',
              product_name: 'Product 1',
              quantity: 10,
              unit: 'box',
              unit_price: 100,
              total_price: 1000,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ],
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const api = await getInventoryApi();
      const result = await api.getReceiptItems('receipt-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].product_id).toBe('PROD001');
    });

    it('should handle error when fetching receipt items', async () => {
      const mockError = {
        response: {
          data: { error: 'Failed to fetch receipt items' },
        },
      };

      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn(),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true) as any;

      const api = await getInventoryApi();
      await expect(api.getReceiptItems('receipt-1')).rejects.toThrow(
        'Failed to fetch receipt items'
      );
    });
  });
});
