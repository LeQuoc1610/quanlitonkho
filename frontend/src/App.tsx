import React, { useState } from 'react';
import { InventoryReceiptForm } from './components/InventoryReceiptForm';
import { ReceiptList } from './components/ReceiptList';
import { InventoryReceipt, ReceiptItemFormData } from './types';
import './App.css';

type Tab = 'form' | 'list';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [listKey, setListKey] = useState(0);
  const [editingReceipt, setEditingReceipt] = useState<InventoryReceipt | null>(null);
  const [editingItems, setEditingItems] = useState<ReceiptItemFormData[] | null>(null);

  const handleTabChange = (tab: Tab) => {
    if (tab === 'list') {
      setListKey(k => k + 1);
    }
    setActiveTab(tab);
  };

  const handleEditReceipt = (receipt: InventoryReceipt, items: ReceiptItemFormData[]) => {
    setEditingReceipt(receipt);
    setEditingItems(items);
    setActiveTab('form');
  };

  const handleSaved = () => {
    setEditingReceipt(null);
    setEditingItems(null);
    setListKey(k => k + 1);
    setActiveTab('list');
  };

  const handleCancelEdit = () => {
    setEditingReceipt(null);
    setEditingItems(null);
    setActiveTab('list');
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>📦 Phiếu Nhập Kho</h1>
        <p>Hệ thống quản lý tồn kho VIMES — Warehouse Receipt System</p>
      </div>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'form' ? 'tab-btn-active' : ''}`}
          onClick={() => handleTabChange('form')}
        >
          ✏️ Tạo phiếu nhập kho
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'tab-btn-active' : ''}`}
          onClick={() => handleTabChange('list')}
        >
          📋 Danh sách phiếu đã lưu
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'form' && (
          <InventoryReceiptForm
            initialReceipt={editingReceipt ?? undefined}
            initialItems={editingItems ?? undefined}
            onSaved={handleSaved}
            onCancel={handleCancelEdit}
          />
        )}
        {activeTab === 'list' && (
          <ReceiptList key={listKey} onEdit={handleEditReceipt} />
        )}
      </div>
    </div>
  );
}

export default App;
