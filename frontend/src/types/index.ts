export interface InventoryReceipt {
  id: string;
  receipt_number: string;
  warehouse_id: string;
  supplier_id: string;
  receipt_date: string;
  delivery_person_name?: string;
  warehouse_keeper_name: string;
  accountant_name?: string;
  director_name?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  batch_number?: string;
  expiration_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReceiptFormData {
  receipt_number: string;
  warehouse_id: string;
  supplier_id: string;
  receipt_date: string;
  delivery_person_name: string;
  warehouse_keeper_name: string;
  accountant_name: string;
  director_name: string;
  notes: string;
}

export interface ReceiptItemFormData {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  batch_number: string;
  expiration_date: string;
  notes: string;
}
