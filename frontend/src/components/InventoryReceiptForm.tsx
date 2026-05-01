import React, { useState, useRef, useEffect } from 'react';
import { InventoryReceipt, ReceiptFormData, ReceiptItemFormData } from '../types';
import { inventoryApi } from '../services/api';
import styles from './InventoryReceiptForm.module.css';

function generateReceiptNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `PN${yy}${mm}-${rand}`;
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

interface InventoryReceiptFormProps {
  initialReceipt?: InventoryReceipt;
  initialItems?: ReceiptItemFormData[];
  onSaved?: () => void;
  onCancel?: () => void;
}

export const InventoryReceiptForm: React.FC<InventoryReceiptFormProps> = ({
  initialReceipt,
  initialItems,
  onSaved,
  onCancel,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<ReceiptFormData>({
    receipt_number: generateReceiptNumber(),
    warehouse_id: '',
    supplier_id: '',
    receipt_date: getLocalDateString(),
    delivery_person_name: '',
    warehouse_keeper_name: '',
    accountant_name: '',
    director_name: '',
    notes: '',
  });

  const [items, setItems] = useState<ReceiptItemFormData[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initialReceipt) {
      setFormData({
        receipt_number: initialReceipt.receipt_number,
        warehouse_id: initialReceipt.warehouse_id,
        supplier_id: initialReceipt.supplier_id,
        receipt_date: typeof initialReceipt.receipt_date === 'string' 
          ? initialReceipt.receipt_date.split('T')[0]
          : new Date(initialReceipt.receipt_date).toISOString().split('T')[0],
        delivery_person_name: initialReceipt.delivery_person_name || '',
        warehouse_keeper_name: initialReceipt.warehouse_keeper_name,
        accountant_name: initialReceipt.accountant_name || '',
        director_name: initialReceipt.director_name || '',
        notes: initialReceipt.notes || '',
      });
      setItems(
        initialItems && initialItems.length > 0
          ? initialItems.map(item => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: Number(item.quantity) || 0,
              unit: item.unit,
              unit_price: Number(item.unit_price) || 0,
              batch_number: item.batch_number || '',
              expiration_date: item.expiration_date || '',
              notes: item.notes || '',
            }))
          : [
              {
                product_id: '',
                product_name: '',
                quantity: 0,
                unit: '',
                unit_price: 0,
                batch_number: '',
                expiration_date: '',
                notes: '',
              },
            ]
      );
      setErrors({});
      setMessage(null);
    }
  }, [initialReceipt, initialItems]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: '',
        product_name: '',
        quantity: 0,
        unit: '',
        unit_price: 0,
        batch_number: '',
        expiration_date: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: '⚠️ Phiếu phải có ít nhất một dòng hàng hoá!' });
    }
  };

  const handleUpdateItem = (index: number, field: keyof ReceiptItemFormData, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };



  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.warehouse_id.trim()) {
      newErrors['warehouse_id'] = 'Vui lòng nhập kho nhập!';
    }
    if (!formData.supplier_id.trim()) {
      newErrors['supplier_id'] = 'Vui lòng nhập nhà cung cấp!';
    }
    if (!formData.warehouse_keeper_name.trim()) {
      newErrors['warehouse_keeper_name'] = 'Vui lòng nhập tên thủ kho!';
    }
    if (!formData.receipt_date) {
      newErrors['receipt_date'] = 'Vui lòng chọn ngày nhập!';
    }

    items.forEach((item, index) => {
      if (!item.product_id.trim()) {
        newErrors[`items[${index}].product_id`] = `Dòng ${index + 1}: Vui lòng nhập mã hàng!`;
      }
      if (!item.product_name.trim()) {
        newErrors[`items[${index}].product_name`] = `Dòng ${index + 1}: Vui lòng nhập tên hàng!`;
      }
      if (!item.unit.trim()) {
        newErrors[`items[${index}].unit`] = `Dòng ${index + 1}: Vui lòng nhập đơn vị tính!`;
      }
      if (item.quantity <= 0) {
        newErrors[`items[${index}].quantity`] = `Dòng ${index + 1}: Số lượng phải > 0!`;
      }
      if (item.unit_price < 0) {
        newErrors[`items[${index}].unit_price`] = `Dòng ${index + 1}: Đơn giá không được âm!`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError: any = null;
    const isEditMode = Boolean(initialReceipt);

    while (attempt < MAX_RETRIES) {
      try {
        const response = isEditMode
          ? await inventoryApi.updateReceipt(initialReceipt!.id, formData, items)
          : await inventoryApi.createReceipt(formData, items);

        if (response.success) {
          setMessage({
            type: 'success',
            text: isEditMode
              ? `✅ Cập nhật phiếu thành công!\n\nSố phiếu: ${response.data?.receipt.receipt_number}`
              : `✅ Lưu phiếu thành công!\n\nSố phiếu: ${response.data?.receipt.receipt_number}`,
          });

          if (!isEditMode) {
            const newReceiptNumber = generateReceiptNumber();
            setFormData({
              receipt_number: newReceiptNumber,
              warehouse_id: '',
              supplier_id: '',
              receipt_date: getLocalDateString(),
              delivery_person_name: '',
              warehouse_keeper_name: '',
              accountant_name: '',
              director_name: '',
              notes: '',
            });
            setItems([]);
          }

          timeoutRef.current = setTimeout(() => {
            if (onSaved) onSaved();
          }, 1200);
          setLoading(false);
          return;
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        const shouldRetry = !isEditMode && (err as any).statusCode === 409 && attempt < MAX_RETRIES - 1;
        if (shouldRetry) {
          attempt++;
          const newReceiptNumber = generateReceiptNumber();
          setFormData(prev => ({
            ...prev,
            receipt_number: newReceiptNumber,
          }));
          continue;
        }
        break;
      }
    }

    setMessage({
      type: 'error',
      text: lastError?.message || (initialReceipt ? 'Có lỗi xảy ra khi cập nhật phiếu' : 'Có lỗi xảy ra khi tạo phiếu'),
    });
    setLoading(false);
  };

  const handlePrint = () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: '⚠️ Vui lòng điền đầy đủ thông tin trước khi in!' });
      return;
    }
    window.print();
  };

  const handleReset = () => {
    if (initialReceipt) {
      setFormData({
        receipt_number: initialReceipt.receipt_number,
        warehouse_id: initialReceipt.warehouse_id,
        supplier_id: initialReceipt.supplier_id,
        receipt_date: typeof initialReceipt.receipt_date === 'string' 
          ? initialReceipt.receipt_date.split('T')[0]
          : new Date(initialReceipt.receipt_date).toISOString().split('T')[0],
        delivery_person_name: initialReceipt.delivery_person_name || '',
        warehouse_keeper_name: initialReceipt.warehouse_keeper_name,
        accountant_name: initialReceipt.accountant_name || '',
        director_name: initialReceipt.director_name || '',
        notes: initialReceipt.notes || '',
      });
      setItems(initialItems || []);
    } else {
      setFormData({
        receipt_number: generateReceiptNumber(),
        warehouse_id: '',
        supplier_id: '',
        receipt_date: getLocalDateString(),
        delivery_person_name: '',
        warehouse_keeper_name: '',
        accountant_name: '',
        director_name: '',
        notes: '',
      });
      setItems([]);
    }
    setErrors({});
    setMessage(null);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const isEditMode = Boolean(initialReceipt);

  return (
    <div className={styles.container}>
      {/* FORM CONTENT */}
      <div className={styles.formContent}>
        <form id="phieuForm" onSubmit={handleSubmit}>
          {/* MESSAGE ALERT */}
          {message && (
            <div
              className={`${styles.messageBox} ${
                message.type === 'success' ? styles.successMessage : styles.errorMessage
              }`}
            >
              {message.text.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}

          {/* FORM HEADER */}
          <div className={styles.formHeader}>
            <div className={styles.companyInfo}>
              <p className={styles.companyName}>CÔNG TY VIMES</p>
              <p className={styles.companySub}>Bộ phận: Kho hàng</p>
            </div>
            <div className={styles.formTitle}>
              <h2>PHIẾU NHẬP KHO</h2>
              <p className={styles.formSubtitle}>Warehouse Receipt Form</p>
            </div>
            <div className={styles.formMeta}>
              <div className={styles.formMetaItem}>
                <label>
                  Ngày nhập <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="receipt_date"
                  value={formData.receipt_date}
                  onChange={handleFormChange}
                  style={
                    errors['receipt_date'] ? { borderColor: '#ef4444', borderWidth: '2px' } : {}
                  }
                />
              </div>
            </div>
          </div>

          {/* INFO BOX */}
          <div className={styles.infoBox}>
            <strong>💡 Hướng dẫn:</strong>
            Điền đầy đủ thông tin kho, nhà cung cấp và chi tiết hàng hoá. Các trường có dấu{' '}
            <span className={styles.required}>*</span> là bắt buộc.
          </div>

          {/* SECTION 1: THÔNG TIN CHUNG */}
          <h3 className={styles.sectionTitle}>1. Thông tin chung</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Kho nhập <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleFormChange}
                placeholder="Nhập kho hoặc mã kho"
                style={
                  errors['warehouse_id'] ? { borderColor: '#ef4444', borderWidth: '2px' } : {}
                }
              />
              {errors['warehouse_id'] && (
                <p className={styles.errorText}>{errors['warehouse_id']}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                Nhà cung cấp <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleFormChange}
                placeholder="Nhập tên hoặc mã nhà cung cấp"
                style={
                  errors['supplier_id'] ? { borderColor: '#ef4444', borderWidth: '2px' } : {}
                }
              />
              {errors['supplier_id'] && (
                <p className={styles.errorText}>{errors['supplier_id']}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Người giao hàng</label>
              <input
                type="text"
                name="delivery_person_name"
                value={formData.delivery_person_name}
                onChange={handleFormChange}
                placeholder="Họ tên người giao"
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Thủ kho (Người nhận) <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="warehouse_keeper_name"
                value={formData.warehouse_keeper_name}
                onChange={handleFormChange}
                placeholder="Họ tên thủ kho"
                style={
                  errors['warehouse_keeper_name']
                    ? { borderColor: '#ef4444', borderWidth: '2px' }
                    : {}
                }
              />
              {errors['warehouse_keeper_name'] && (
                <p className={styles.errorText}>{errors['warehouse_keeper_name']}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Kế toán trưởng</label>
              <input
                type="text"
                name="accountant_name"
                value={formData.accountant_name}
                onChange={handleFormChange}
                placeholder="Họ tên kế toán"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Giám đốc (Ký duyệt)</label>
              <input
                type="text"
                name="director_name"
                value={formData.director_name}
                onChange={handleFormChange}
                placeholder="Họ tên giám đốc"
              />
            </div>
          </div>

          {/* SECTION 2: CHI TIẾT HÀNG HOÁ */}
          <h3 className={styles.sectionTitle}>2. Chi tiết hàng hoá nhập kho</h3>
          <div className={styles.tableHeader}>
            <h3 style={{ fontSize: '1.05em', margin: 0 }}>Danh sách hàng hoá</h3>
            <button type="button" className={styles.btnAdd} onClick={handleAddItem}>
              + Thêm dòng
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>STT</th>
                  <th style={{ width: '12%' }}>Mã hàng</th>
                  <th style={{ width: '20%' }}>Tên hàng hoá</th>
                  <th style={{ width: '8%' }}>ĐVT</th>
                  <th style={{ width: '10%' }}>
                    SL Nhập <span className={styles.required}>*</span>
                  </th>
                  <th style={{ width: '12%' }}>
                    Đơn giá <span className={styles.required}>*</span>
                  </th>
                  <th style={{ width: '13%' }}>Thành tiền</th>
                  <th style={{ width: '10%' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className={styles.dongChiTiet}>
                    <td className={styles.tdStt}>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.product_id}
                        onChange={(e) =>
                          handleUpdateItem(index, 'product_id', e.target.value)
                        }
                        placeholder="Nhập mã hàng"
                        style={
                          errors[`items[${index}].product_id`]
                            ? { borderColor: '#ef4444', borderWidth: '2px' }
                            : {}
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.product_name}
                        onChange={(e) =>
                          handleUpdateItem(index, 'product_name', e.target.value)
                        }
                        placeholder="Tên hàng hoá"
                        style={
                          errors[`items[${index}].product_name`]
                            ? { borderColor: '#ef4444', borderWidth: '2px' }
                            : {}
                        }
                      />
                    </td>
                    <td className={styles.tdCenter}>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.unit}
                        onChange={(e) =>
                          handleUpdateItem(index, 'unit', e.target.value)
                        }
                        placeholder="ĐVT"
                        style={
                          errors[`items[${index}].unit`]
                            ? { borderColor: '#ef4444', borderWidth: '2px' }
                            : {}
                        }
                      />
                    </td>
                    <td className={styles.tdCenter}>
                      <input
                        type="number"
                        className={styles.tableInput}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                        min="0"
                        style={
                          errors[`items[${index}].quantity`]
                            ? { borderColor: '#ef4444', borderWidth: '2px' }
                            : {}
                        }
                      />
                    </td>
                    <td className={styles.tdCenter}>
                      <input
                        type="number"
                        className={styles.tableInput}
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        style={
                          errors[`items[${index}].unit_price`]
                            ? { borderColor: '#ef4444', borderWidth: '2px' }
                            : {}
                        }
                      />
                    </td>
                    <td className={`${styles.tdMoney} ${styles.thanhTien}`}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.quantity * item.unit_price)}
                    </td>
                    <td className={styles.tdCenter}>
                      <button
                        type="button"
                        className={styles.btnDelete}
                        onClick={() => handleRemoveItem(index)}
                      >
                        🗑 Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className={styles.tfootLabel}>
                    TỔNG CỘNG
                  </td>
                  <td className={styles.tfootTotal}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SECTION 3: GHI CHÚ */}
          <h3 className={styles.sectionTitle}>3. Ghi chú thêm</h3>
          <div className={styles.noteSection}>
            <label>Ghi chú</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Nhập ghi chú thêm về phiếu nhập kho (nếu có)..."
            />
          </div>

          {/* FORM ACTIONS */}
          <div className={styles.formActions}>
            {isEditMode && onCancel && (
              <button type="button" className={styles.btnSecondary} onClick={onCancel}>
                ✕ Huỷ sửa
              </button>
            )}
            <button type="button" className={styles.btnSecondary} onClick={handleReset}>
              ↺ Đặt lại
            </button>
            <button type="button" className={styles.btnSecondary} onClick={handlePrint}>
              🖨️ In phiếu
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? (isEditMode ? '💾 Đang cập nhật...' : '💾 Đang lưu...') : isEditMode ? '💾 Cập nhật' : '💾 Lưu phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
