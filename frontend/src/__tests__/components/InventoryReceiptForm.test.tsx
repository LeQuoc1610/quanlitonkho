import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { InventoryReceiptForm } from '../../components/InventoryReceiptForm';
import { inventoryApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  inventoryApi: {
    createReceipt: vi.fn(),
  },
}));

const mockedCreateReceipt = inventoryApi.createReceipt as unknown as ReturnType<typeof vi.fn>;

describe('InventoryReceiptForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    Object.defineProperty(window, 'print', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<InventoryReceiptForm />);

    await user.click(screen.getByRole('button', { name: /Lưu phiếu/i }));

    expect(screen.getByText('Vui lòng nhập kho nhập!')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập nhà cung cấp!')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập tên thủ kho!')).toBeInTheDocument();
    expect(mockedCreateReceipt).not.toHaveBeenCalled();
  });

  it('submits a valid receipt, resets the form, and calls onSaved', async () => {
    const onSaved = vi.fn();
    mockedCreateReceipt.mockResolvedValue({
      success: true,
      data: {
        receipt: {
          id: 'receipt-1',
          receipt_number: 'PN2604-1234',
          warehouse_id: 'WH001',
          supplier_id: 'SUP001',
          receipt_date: '2026-04-30',
          warehouse_keeper_name: 'Nguyen Van A',
          created_at: '2026-04-30T00:00:00Z',
          updated_at: '2026-04-30T00:00:00Z',
        },
        items: [
          {
            id: 'item-1',
            receipt_id: 'receipt-1',
            product_id: 'P001',
            product_name: 'Sản phẩm A',
            quantity: 5,
            unit: 'thùng',
            unit_price: 100000,
            total_price: 500000,
            created_at: '2026-04-30T00:00:00Z',
            updated_at: '2026-04-30T00:00:00Z',
          },
        ],
      },
    } as any);

    const user = userEvent.setup();
    const { container } = render(<InventoryReceiptForm onSaved={onSaved} />);

    fireEvent.change(screen.getByPlaceholderText('Nhập kho hoặc mã kho'), {
      target: { value: 'WH001' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập tên hoặc mã nhà cung cấp'), {
      target: { value: 'SUP001' },
    });
    fireEvent.change(screen.getByPlaceholderText('Họ tên thủ kho'), {
      target: { value: 'Nguyen Van A' },
    });

    await user.click(screen.getByRole('button', { name: /Thêm dòng/i }));

    fireEvent.change(screen.getByPlaceholderText('Nhập mã hàng'), {
      target: { value: 'P001' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tên hàng hoá'), {
      target: { value: 'Sản phẩm A' },
    });

    fireEvent.change(screen.getByPlaceholderText('ĐVT'), {
      target: { value: 'thùng' },
    });

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs).toHaveLength(2);
    fireEvent.change(numberInputs[0], { target: { value: '5' } });
    fireEvent.change(numberInputs[1], { target: { value: '100000' } });

    await user.click(screen.getByRole('button', { name: /Lưu phiếu/i }));

    await waitFor(() => expect(mockedCreateReceipt).toHaveBeenCalledTimes(1));
    expect(mockedCreateReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        warehouse_keeper_name: 'Nguyen Van A',
      }),
      [
        expect.objectContaining({
          product_id: 'P001',
          product_name: 'Sản phẩm A',
          quantity: 5,
          unit_price: 100000,
        }),
      ]
    );

    expect(await screen.findByText(/Lưu phiếu thành công!/i)).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 1300));

    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
