const { validateCreateReceipt } = require('../../dist/middleware/validation');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateCreateReceipt', () => {
  it('passes for a valid payload', () => {
    const req = {
      body: {
        receipt_number: 'PN2604-1234',
        warehouse_id: 'WH001',
        supplier_id: 'SUP001',
        receipt_date: '2026-04-30',
        warehouse_keeper_name: 'Nguyen Van A',
        items: [
          {
            product_id: 'P001',
            product_name: 'San pham A',
            quantity: 5,
            unit: 'thung',
            unit_price: 100000,
          },
        ],
      },
    };
    const res = createRes();
    const next = jest.fn();

    validateCreateReceipt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with validation details for an invalid payload', () => {
    const req = {
      body: {
        receipt_number: '',
        warehouse_id: '',
        supplier_id: '   ',
        receipt_date: '30-04-2026',
        warehouse_keeper_name: '',
        items: [
          {
            product_id: '',
            product_name: null,
            quantity: 0,
            unit: '',
            unit_price: -1,
          },
        ],
      },
    };
    const res = createRes();
    const next = jest.fn();

    validateCreateReceipt(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([
          'receipt_number is required and must be a non-empty string',
          'warehouse_id is required and must be a non-empty string',
          'supplier_id is required and must be a non-empty string',
          'receipt_date must be in format YYYY-MM-DD',
          'warehouse_keeper_name is required and must be a non-empty string',
          'items[0].product_id is required',
          'items[0].product_name is required',
          'items[0].quantity must be a positive integer',
          'items[0].unit is required',
          'items[0].unit_price must be a finite non-negative number',
        ]),
      })
    );
  });
});
