import axios, { AxiosInstance, AxiosError } from 'axios';
import { ReceiptFormData, ReceiptItemFormData, InventoryReceipt, InventoryReceiptItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  data?: T;
}

interface ListReceiptsResponse {
  receipts: InventoryReceipt[];
  total: number;
  page: number;
  pageSize: number;
}

interface ReceiptWithItems {
  receipt: InventoryReceipt;
  items: InventoryReceiptItem[];
}

class InventoryApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createReceipt(
    receiptData: ReceiptFormData,
    items: ReceiptItemFormData[]
  ): Promise<ApiResponse<ReceiptWithItems>> {
    try {
      const response = await this.api.post<ApiResponse<ReceiptWithItems>>('/inventory/receipts', {
        ...receiptData,
        receipt_date: typeof receiptData.receipt_date === 'string' 
          ? receiptData.receipt_date.split('T')[0]
          : new Date(receiptData.receipt_date).toISOString().split('T')[0],
        items: items.map(item => ({
          product_id: String(item.product_id || '').trim(),
          product_name: String(item.product_name || '').trim(),
          quantity: Number(item.quantity) || 0,
          unit: String(item.unit || '').trim(),
          unit_price: Number(item.unit_price) || 0,
          batch_number: item.batch_number ? String(item.batch_number).trim() : undefined,
          expiration_date: item.expiration_date ? String(item.expiration_date).trim() : undefined,
          notes: item.notes ? String(item.notes).trim() : undefined,
        })),
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          const err = new Error('Receipt number already exists');
          (err as any).statusCode = 409;
          throw err;
        }
        const errorData = error.response?.data as any;
        const errorMessage = errorData?.error || 'Failed to create receipt';
        const details = errorData?.details;
        const fullMessage = details && Array.isArray(details) 
          ? `${errorMessage}\n${details.join('\n')}`
          : errorMessage;
        throw new Error(fullMessage);
      }
      throw new Error(String(error));
    }
  }

  async updateReceipt(
    receiptId: string,
    receiptData: ReceiptFormData,
    items: ReceiptItemFormData[]
  ): Promise<ApiResponse<ReceiptWithItems>> {
    try {
      const response = await this.api.put<ApiResponse<ReceiptWithItems>>(`/inventory/receipts/${receiptId}`, {
        ...receiptData,
        receipt_date: typeof receiptData.receipt_date === 'string' 
          ? receiptData.receipt_date.split('T')[0]
          : new Date(receiptData.receipt_date).toISOString().split('T')[0],
        items: items.map(item => ({
          product_id: String(item.product_id || '').trim(),
          product_name: String(item.product_name || '').trim(),
          quantity: Number(item.quantity) || 0,
          unit: String(item.unit || '').trim(),
          unit_price: Number(item.unit_price) || 0,
          batch_number: item.batch_number ? String(item.batch_number).trim() : undefined,
          expiration_date: item.expiration_date ? String(item.expiration_date).trim() : undefined,
          notes: item.notes ? String(item.notes).trim() : undefined,
        })),
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          const err = new Error('Receipt number already exists');
          (err as any).statusCode = 409;
          throw err;
        }
        const errorData = error.response?.data as any;
        const errorMessage = errorData?.error || 'Failed to update receipt';
        const details = errorData?.details;
        const fullMessage = details && Array.isArray(details) 
          ? `${errorMessage}\n${details.join('\n')}`
          : errorMessage;
        throw new Error(fullMessage);
      }
      throw new Error(String(error));
    }
  }

  async deleteReceipt(receiptId: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.delete<ApiResponse<null>>(`/inventory/receipts/${receiptId}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete receipt');
      }
      throw new Error(String(error));
    }
  }

  async getReceipt(receiptId: string): Promise<ApiResponse<ReceiptWithItems>> {
    try {
      const response = await this.api.get<ApiResponse<ReceiptWithItems>>(`/inventory/receipts/${receiptId}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch receipt');
      }
      throw new Error(String(error));
    }
  }

  async listReceipts(page = 1, pageSize = 10, filters?: Record<string, string>): Promise<ApiResponse<ListReceiptsResponse>> {
    try {
      const response = await this.api.get<ApiResponse<ListReceiptsResponse>>('/inventory/receipts', {
        params: {
          page,
          pageSize,
          ...filters,
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch receipts');
      }
      throw new Error(String(error));
    }
  }

  async getReceiptItems(receiptId: string): Promise<ApiResponse<InventoryReceiptItem[]>> {
    try {
      const response = await this.api.get<ApiResponse<InventoryReceiptItem[]>>(`/inventory/receipts/${receiptId}/items`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch receipt items');
      }
      throw new Error(String(error));
    }
  }
}

export const inventoryApi = new InventoryApi();
