jest.mock('../../dist/services/inventoryService', () => ({
  inventoryService: {
    createReceipt: jest.fn(),
    getReceiptById: jest.fn(),
    listReceipts: jest.fn(),
    getReceiptItems: jest.fn(),
  },
}));

const router = require('../../dist/routes/inventory').default;
const { inventoryService } = require('../../dist/services/inventoryService');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const getRoute = (method, path) => {
  const layer = router.stack.find((item) => item.route && item.route.path === path && item.route.methods[method]);
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack;
};

describe('inventory routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a receipt successfully', async () => {
    const stack = getRoute('post', '/receipts');
    const handler = stack[1].handle;
    const req = {
      body: {
        receipt_number: 'PN2604-1234',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2026-04-30',
        warehouse_keeper_name: 'Nguyen Van A',
        items: [],
      },
    };
    const res = createRes();

    inventoryService.createReceipt.mockResolvedValue({
      receipt: { id: 'receipt-1', receipt_number: 'PN2604-1234' },
      items: [],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Receipt created successfully',
      })
    );
  });

  it('returns 409 when receipt number is duplicated', async () => {
    const stack = getRoute('post', '/receipts');
    const handler = stack[1].handle;
    const req = { body: {} };
    const res = createRes();

    inventoryService.createReceipt.mockRejectedValue(
      new Error('duplicate key value violates unique constraint "inventory_receipts_receipt_number_key" (23505)')
    );

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Receipt number already exists',
    });
  });

  it('returns a single receipt by id', async () => {
    const stack = getRoute('get', '/receipts/:id');
    const handler = stack[0].handle;
    const req = { params: { id: 'receipt-1' } };
    const res = createRes();

    inventoryService.getReceiptById.mockResolvedValue({
      receipt: { id: 'receipt-1', receipt_number: 'PN2604-1234' },
      items: [],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it('returns 404 when the receipt is missing', async () => {
    const stack = getRoute('get', '/receipts/:id');
    const handler = stack[0].handle;
    const req = { params: { id: 'missing' } };
    const res = createRes();

    inventoryService.getReceiptById.mockResolvedValue(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Receipt not found',
    });
  });

  it('clamps pagination when listing receipts', async () => {
    const stack = getRoute('get', '/receipts');
    const handler = stack[0].handle;
    const req = {
      query: {
        page: '0',
        pageSize: '500',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
      },
    };
    const res = createRes();

    inventoryService.listReceipts.mockResolvedValue({ receipts: [], total: 0 });

    await handler(req, res);

    expect(inventoryService.listReceipts).toHaveBeenCalledWith(1, 100, {
      warehouse_id: 'WH001',
      supplier_id: 'SUP001',
      start_date: undefined,
      end_date: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 for receipt items when receipt does not exist', async () => {
    const stack = getRoute('get', '/receipts/:id/items');
    const handler = stack[0].handle;
    const req = { params: { id: 'missing' } };
    const res = createRes();

    inventoryService.getReceiptItems.mockResolvedValue([]);
    inventoryService.getReceiptById.mockResolvedValue(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Receipt not found',
    });
  });
});
