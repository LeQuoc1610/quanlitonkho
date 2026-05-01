import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../App';

vi.mock('../components/InventoryReceiptForm', () => ({
  InventoryReceiptForm: ({ onSaved }: { onSaved?: () => void }) => (
    <div>
      <div>Mock Inventory Form</div>
      <button onClick={() => onSaved?.()}>Trigger Saved</button>
    </div>
  ),
}));

vi.mock('../components/ReceiptList', () => ({
  ReceiptList: () => <div>Mock Receipt List</div>,
}));

describe('App', () => {
  it('switches tabs and moves to the list after saving from the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Mock Inventory Form')).toBeInTheDocument();
    expect(screen.queryByText('Mock Receipt List')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Danh sách phiếu đã lưu/i }));
    expect(screen.getByText('Mock Receipt List')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tạo phiếu nhập kho/i }));
    expect(screen.getByText('Mock Inventory Form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Trigger Saved/i }));
    expect(screen.getByText('Mock Receipt List')).toBeInTheDocument();
  });
});
