import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService';
import { validateCreateReceipt } from '../middleware/validation';
import { CreateReceiptRequest } from '../models/types';

const router = Router();

router.post('/receipts', validateCreateReceipt, async (req: Request, res: Response) => {
  try {
    const request = req.body as CreateReceiptRequest;
    const result = await inventoryService.createReceipt(request);

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: result,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error creating receipt:', err);

    if (err.message.includes('duplicate key') || err.message.includes('23505')) {
      return res.status(409).json({
        success: false,
        error: `Receipt number already exists`,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create receipt',
      details: err.message,
    });
  }
});

router.get('/receipts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await inventoryService.getReceiptById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching receipt:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt',
      details: err.message,
    });
  }
});

router.get('/receipts', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));

    const filters = {
      warehouse_id: req.query.warehouse_id as string,
      supplier_id: req.query.supplier_id as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const result = await inventoryService.listReceipts(page, pageSize, filters);

    res.status(200).json({
      success: true,
      data: {
        receipts: result.receipts,
        total: result.total,
        page,
        pageSize,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching receipts:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts',
      details: err.message,
    });
  }
});

router.put('/receipts/:id', validateCreateReceipt, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = req.body as CreateReceiptRequest;
    const result = await inventoryService.updateReceipt(id, request);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: result,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error updating receipt:', err);

    if (err.message.includes('duplicate key') || err.message.includes('23505')) {
      return res.status(409).json({
        success: false,
        error: 'Receipt number already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update receipt',
      details: err.message,
    });
  }
});

router.delete('/receipts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await inventoryService.deleteReceipt(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error deleting receipt:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to delete receipt',
      details: err.message,
    });
  }
});

router.get('/receipts/:id/items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = await inventoryService.getReceiptItems(id);

    if (items.length === 0) {
      const receipt = await inventoryService.getReceiptById(id);
      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching receipt items:', err);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt items',
      details: err.message,
    });
  }
});

export default router;
