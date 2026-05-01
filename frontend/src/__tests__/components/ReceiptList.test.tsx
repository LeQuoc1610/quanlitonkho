import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ReceiptList } from '../../components/ReceiptList';
import { inventoryApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  inventoryApi: {
    listReceipts: vi.fn(),
    getReceiptItems: vi.fn(),
  },
}));

const mockedListReceipts = inventoryApi.listReceipts as unknown as ReturnType<typeof vi.fn>;
const mockedGetReceiptItems = inventoryApi.getReceiptItems as unknown as ReturnType<typeof vi.fn>;

describe('ReceiptList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the receipt list and opens the detail modal', async () => {
    mockedListReceipts.mockResolvedValue({
      success: true,
      data: {
        receipts: [
          {
            id: 'receipt-1',
            receipt_number: 'PN2401-1234',
            warehouse_id: 'WH001',
            supplier_id: 'SUP001',
            receipt_date: '2024-01-15',
            warehouse_keeper_name: 'Nguyen Van A',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      },
    } as any);

    mockedGetReceiptItems.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'item-1',
          receipt_id: 'receipt-1',
          product_id: 'P001',
          product_name: 'Sản phẩm A',
          quantity: 5,
          unit: 'thùng',
          unit_price: 100000,
          total_price: 500000,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ],
    } as any);

    const user = userEvent.setup();
    render(<ReceiptList />);

    expect(await screen.findByText('PN2401-1234')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Xem/i }));

    expect(await screen.findByText('Chi tiết phiếu nhập kho')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
  });

  it('shows an error state when loading receipts fails', async () => {
    mockedListReceipts.mockRejectedValue(new Error('Không thể tải dữ liệu'));

    render(<ReceiptList />);

    expect(await screen.findByText(/Không thể tải dữ liệu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
  });
});
