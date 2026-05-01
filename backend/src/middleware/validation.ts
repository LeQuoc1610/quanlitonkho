import { Request, Response, NextFunction } from 'express';
import { CreateReceiptRequest } from '../models/types';

export const validateCreateReceipt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { 
    receipt_number, 
    warehouse_id, 
    supplier_id, 
    receipt_date, 
    warehouse_keeper_name,
    items 
  } = req.body as CreateReceiptRequest;

  const errors: string[] = [];

  if (!receipt_number || typeof receipt_number !== 'string' || receipt_number.trim() === '') {
    errors.push('receipt_number is required and must be a non-empty string');
  }

  if (!warehouse_id || typeof warehouse_id !== 'string' || warehouse_id.trim() === '') {
    errors.push('warehouse_id is required and must be a non-empty string');
  }

  if (!supplier_id || typeof supplier_id !== 'string' || supplier_id.trim() === '') {
    errors.push('supplier_id is required and must be a non-empty string');
  }

  if (!receipt_date || typeof receipt_date !== 'string') {
    errors.push('receipt_date is required and must be a valid date string (YYYY-MM-DD)');
  } else {
    const dateStr = receipt_date.trim();
    let normalizedDate = dateStr;
    
    if (/^\d+$/.test(dateStr)) {
      normalizedDate = new Date(parseInt(dateStr)).toISOString().split('T')[0];
    } else if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      normalizedDate = dateStr.split('T')[0];
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      errors.push('receipt_date must be in format YYYY-MM-DD');
    } else {
      req.body.receipt_date = normalizedDate;
    }
  }

  if (!warehouse_keeper_name || typeof warehouse_keeper_name !== 'string' || warehouse_keeper_name.trim() === '') {
    errors.push('warehouse_keeper_name is required and must be a non-empty string');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    items.forEach((item, index) => {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`items[${index}] must be a valid object`);
        return;
      }

      if (!item.product_id || typeof item.product_id !== 'string' || item.product_id.trim() === '') {
        errors.push(`Dòng ${index + 1}: Mã hàng không được để trống`);
      }
      if (!item.product_name || typeof item.product_name !== 'string' || item.product_name.trim() === '') {
        errors.push(`Dòng ${index + 1}: Tên hàng hoá không được để trống`);
      }
      if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        errors.push(`Dòng ${index + 1}: Số lượng phải là số nguyên dương`);
      }
      if (!item.unit || typeof item.unit !== 'string' || item.unit.trim() === '') {
        errors.push(`Dòng ${index + 1}: Đơn vị tính không được để trống`);
      }
      if (typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0) {
        errors.push(`Dòng ${index + 1}: Đơn giá phải là số không âm`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};
