import React, { useState, useEffect, useCallback } from 'react';
import { InventoryReceipt, InventoryReceiptItem, ReceiptItemFormData } from '../types';
import { inventoryApi } from '../services/api';
import styles from './ReceiptList.module.css';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
};

interface ReceiptDetailModalProps {
  receipt: InventoryReceipt;
  items: InventoryReceiptItem[];
  onClose: () => void;
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({ receipt, items, onClose }) => {
  const total = items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Chi tiết phiếu nhập kho</h2>
            <span className={styles.receiptNumberBadge}>{receipt.receipt_number}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.detailGrid}>
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Kho nhập</span>
              <span className={styles.detailValue}>{receipt.warehouse_id}</span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Nhà cung cấp</span>
              <span className={styles.detailValue}>{receipt.supplier_id}</span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Ngày nhập</span>
              <span className={styles.detailValue}>{formatDate(receipt.receipt_date)}</span>
            </div>
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Ngày tạo</span>
              <span className={styles.detailValue}>{formatDate(receipt.created_at)}</span>
            </div>
            {receipt.delivery_person_name && (
              <div className={styles.detailGroup}>
                <span className={styles.detailLabel}>Người giao hàng</span>
                <span className={styles.detailValue}>{receipt.delivery_person_name}</span>
              </div>
            )}
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Thủ kho</span>
              <span className={styles.detailValue}>{receipt.warehouse_keeper_name}</span>
            </div>
            {receipt.accountant_name && (
              <div className={styles.detailGroup}>
                <span className={styles.detailLabel}>Kế toán</span>
                <span className={styles.detailValue}>{receipt.accountant_name}</span>
              </div>
            )}
            {receipt.director_name && (
              <div className={styles.detailGroup}>
                <span className={styles.detailLabel}>Giám đốc</span>
                <span className={styles.detailValue}>{receipt.director_name}</span>
              </div>
            )}
            {receipt.notes && (
              <div className={`${styles.detailGroup} ${styles.detailGroupFull}`}>
                <span className={styles.detailLabel}>Ghi chú</span>
                <span className={styles.detailValue}>{receipt.notes}</span>
              </div>
            )}
          </div>

          <h3 className={styles.itemsTitle}>Danh sách hàng hoá ({items.length} mặt hàng)</h3>
          <div className={styles.modalTableWrapper}>
            <table className={styles.modalTable}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng hoá</th>
                  <th>ĐVT</th>
                  <th>SL Nhập</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  {items.some(i => i.batch_number) && <th>Lô hàng</th>}
                  {items.some(i => i.expiration_date) && <th>HSD</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td><code>{item.product_id}</code></td>
                    <td>{item.product_name}</td>
                    <td>{item.unit || '—'}</td>
                    <td><strong>{item.quantity}</strong></td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td className={styles.moneyCell}>{formatCurrency(item.total_price)}</td>
                    {items.some(i => i.batch_number) && <td>{item.batch_number || '—'}</td>}
                    {items.some(i => i.expiration_date) && (
                      <td>{item.expiration_date ? formatDate(item.expiration_date) : '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={items.some(i => i.batch_number || i.expiration_date) ? 9 : 7} className={styles.totalLabel}>
                    TỔNG CỘNG
                  </td>
                  <td className={styles.totalValue}>{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnPrint} onClick={() => window.print()}>🖨️ In phiếu</button>
          <button className={styles.btnClose} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

interface ReceiptListProps {
  onEdit?: (receipt: InventoryReceipt, items: ReceiptItemFormData[]) => void;
}

export const ReceiptList: React.FC<ReceiptListProps> = ({ onEdit }) => {
  const [receipts, setReceipts] = useState<InventoryReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<InventoryReceiptItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [searchWarehouse, setSearchWarehouse] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const fetchWithFilters = useCallback(
    async (filters: Record<string, string> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await inventoryApi.listReceipts(page, pageSize, filters);
        if (res.success && res.data) {
          setReceipts(res.data.receipts);
          setTotal(res.data.total);
        } else {
          setError(res.error || 'Không thể tải danh sách phiếu');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối đến server');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  const fetchReceipts = useCallback(async () => {
    const filters: Record<string, string> = {};
    if (searchWarehouse) filters.warehouse_id = searchWarehouse;
    if (searchSupplier) filters.supplier_id = searchSupplier;
    if (searchDateFrom) filters.start_date = searchDateFrom;
    if (searchDateTo) filters.end_date = searchDateTo;
    await fetchWithFilters(filters);
  }, [searchWarehouse, searchSupplier, searchDateFrom, searchDateTo, fetchWithFilters]);

  const handleEdit = async (receipt: InventoryReceipt) => {
    if (!onEdit) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getReceipt(receipt.id);
      if (res.success && res.data) {
        onEdit(res.data.receipt, res.data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          batch_number: item.batch_number || '',
          expiration_date: item.expiration_date || '',
          notes: item.notes || '',
        })));
      } else {
        setError(res.error || 'Không thể tải thông tin phiếu để sửa');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải phiếu để sửa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (receiptId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xoá phiếu này không?');
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await inventoryApi.deleteReceipt(receiptId);
      if (res.success) {
        setSuccessMessage('Xoá phiếu thành công.');
        fetchReceipts();
      } else {
        setError(res.error || 'Không thể xoá phiếu');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xoá phiếu');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleViewDetail = async (receipt: InventoryReceipt) => {
    setLoadingDetail(true);
    setSelectedReceipt(receipt);
    try {
      const res = await inventoryApi.getReceiptItems(receipt.id);
      if (res.success && res.data) {
        setSelectedItems(res.data);
      } else {
        setSelectedItems([]);
      }
    } catch {
      setSelectedItems([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilter = () => {
    setSearchWarehouse('');
    setSearchSupplier('');
    setSearchDateFrom('');
    setSearchDateTo('');
    fetchWithFilters({});
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <form className={styles.filterForm} onSubmit={handleSearch}>
          <div className={styles.filterGroup}>
            <label>Kho nhập</label>
            <input
              type="text"
              value={searchWarehouse}
              onChange={e => setSearchWarehouse(e.target.value)}
              placeholder="Tìm theo kho..."
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Nhà cung cấp</label>
            <input
              type="text"
              value={searchSupplier}
              onChange={e => setSearchSupplier(e.target.value)}
              placeholder="Tìm theo NCC..."
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Từ ngày</label>
            <input
              type="date"
              value={searchDateFrom}
              onChange={e => setSearchDateFrom(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Đến ngày</label>
            <input
              type="date"
              value={searchDateTo}
              onChange={e => setSearchDateTo(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.btnSearch}>🔍 Tìm kiếm</button>
            <button type="button" className={styles.btnClear} onClick={handleClearFilter}>✕ Xóa lọc</button>
          </div>
        </form>
      </div>

      <div className={styles.statsBar}>
        <span className={styles.statsText}>
          {loading ? 'Đang tải...' : `Tổng cộng ${total} phiếu nhập kho`}
        </span>
        <button className={styles.btnRefresh} onClick={fetchReceipts} disabled={loading}>
          ↻ Làm mới
        </button>
      </div>

      {error && (
        <div className={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchReceipts} className={styles.retryBtn}>Thử lại</button>
        </div>
      )}

      {successMessage && !error && (
        <div className={styles.successBox}>
          ✅ {successMessage}
        </div>
      )}

      {!error && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Số phiếu</th>
                <th>Ngày nhập</th>
                <th>Kho nhập</th>
                <th>Nhà cung cấp</th>
                <th>Thủ kho</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.loadingCell}>
                    <div className={styles.loadingSpinner}>⏳ Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>📭</span>
                      <p>Chưa có phiếu nhập kho nào</p>
                      <small>Hãy tạo phiếu nhập kho đầu tiên của bạn</small>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, idx) => (
                  <tr key={receipt.id} className={styles.tableRow}>
                    <td className={styles.tdCenter}>{(page - 1) * pageSize + idx + 1}</td>
                    <td>
                      <span className={styles.receiptNumber}>{receipt.receipt_number}</span>
                    </td>
                    <td>{formatDate(receipt.receipt_date)}</td>
                    <td>
                      <span className={styles.warehouseBadge}>{receipt.warehouse_id}</span>
                    </td>
                    <td>{receipt.supplier_id}</td>
                    <td>{receipt.warehouse_keeper_name}</td>
                    <td className={styles.dateCell}>{formatDate(receipt.created_at)}</td>
                    <td className={styles.tdCenter}>
                      <button
                        className={styles.btnView}
                        onClick={() => handleViewDetail(receipt)}
                        disabled={loadingDetail || actionLoading}
                      >
                        👁 Xem
                      </button>
                      <button
                        className={styles.btnEdit}
                        onClick={() => handleEdit(receipt)}
                        disabled={actionLoading}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => handleDelete(receipt.id)}
                        disabled={actionLoading}
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${page === pageNum ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Sau →
          </button>
          <span className={styles.pageInfo}>Trang {page} / {totalPages}</span>
        </div>
      )}

      {selectedReceipt && !loadingDetail && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          items={selectedItems}
          onClose={() => {
            setSelectedReceipt(null);
            setSelectedItems([]);
          }}
        />
      )}

      {loadingDetail && (
        <div className={styles.modalOverlay}>
          <div className={styles.loadingModal}>⏳ Đang tải chi tiết phiếu...</div>
        </div>
      )}
    </div>
  );
};
