# Warehouse Inventory Receipt System

Hệ thống quản lý phiếu nhập kho với đầy đủ chức năng tạo, chỉnh sửa và xem danh sách phiếu nhập.

## Mô tả dự án

Dự án gồm 2 phần:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript + PostgreSQL

Hệ thống cho phép:
- Tạo phiếu nhập kho mới với thông tin kho, nhà cung cấp, thủ kho và danh sách hàng hóa
- Chỉnh sửa phiếu nhập kho đã lưu
- Xem danh sách phiếu nhập đã lưu với phân trang
- In phiếu nhập kho

## Công nghệ sử dụng

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Vitest** - Testing framework
- **Testing Library** - React testing utilities

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **node-postgres (pg)** - PostgreSQL client

## Cấu trúc dự án

```
baitest/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── app.ts          # Express app setup
│   │   ├── database/       # Database connection & schema
│   │   ├── middleware/     # Validation middleware
│   │   ├── models/         # TypeScript types
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── package.json
│
└── frontend/               # Frontend React app
    ├── src/
    │   ├── components/     # React components
    │   ├── services/       # API service
    │   ├── types/          # TypeScript types
    │   └── App.tsx         # Main app
    ├── vite.config.ts      # Vite + Vitest config
    └── package.json
```

## Cài đặt

### Yêu cầu
- Node.js 18+
- PostgreSQL
- npm hoặc yarn

### Backend

```bash
cd backend
npm install
```

Cấu hình database connection trong `src/database/connection.ts` nếu cần.

### Frontend

```bash
cd frontend
npm install
```

## Chạy ứng dụng

### Backend

```bash
cd backend
npm start
```

Backend sẽ chạy tại `http://localhost:3000`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3001`

## Chạy test

### Frontend (Vitest)

```bash
cd frontend
npm test          # Chạy watch mode
npm run test:run  # Chạy 1 lần rồi thoát
```

### Backend

Nếu có test backend, chạy tương tự với `npm test`.

## Các tính năng đã fix

### 1. Fix lỗi validation `receipt_date` (Yêu cầu ban đầu)

**Vấn đề**: Khi chỉnh sửa phiếu nhập, backend trả về lỗi:
```
Validation failed receipt_date must be in format YYYY-MM-DD
```

**Nguyên nhân**: PostgreSQL trả về date dạng ISO string (VD: `2024-01-15T00:00:00.000Z`) nhưng input type="date" chỉ chấp nhận `YYYY-MM-DD`. Khi gửi lại backend, format không đúng.

**Giải pháp**:
- **Frontend** (`InventoryReceiptForm.tsx`): Khi load `initialReceipt`, luôn `.split('T')[0]` để lấy phần YYYY-MM-DD
- **Frontend** (`api.ts`): Khi gửi request, luôn `.split('T')[0]` trên `receipt_date` để đảm bảo format
- **Backend** (`validation.ts`): Sau khi normalize date trong middleware, update `req.body.receipt_date` với giá trị đã normalize

### 2. Migration từ Jest sang Vitest

**Vấn đề**: Dùng Vitest nhưng code test vẫn dùng `jest.mock`, `jest.fn` → lỗi `ReferenceError: jest is not defined`.

**Giải pháp**:
- Cấu hình Vitest trong `vite.config.ts` (environment: jsdom, globals: true, setupFiles)
- Đổi toàn bộ `jest.*` → `vi.*` trong các file test
- Đổi `tsconfig.json` types từ `jest` → `vitest/globals`
- Thêm script `test` và `test:run` trong `package.json`
- Xoá `jest.config.cjs` và các dependency Jest (`jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`)
- Fix `api.test.ts`: dùng `vi.resetModules()` và dynamic import để mock axios đúng cách
- Fix `InventoryReceiptForm.test.tsx`: đảm bảo user-event hoạt động với timers trong Vitest

## API Endpoints

### Phiếu nhập kho (Inventory Receipts)

- `POST /api/receipts` - Tạo phiếu nhập mới
- `GET /api/receipts` - Lấy danh sách phiếu nhập (có phân trang, filter)
- `GET /api/receipts/:id` - Lấy chi tiết phiếu nhập
- `PUT /api/receipts/:id` - Cập nhật phiếu nhập
- `DELETE /api/receipts/:id` - Xoá phiếu nhập
- `GET /api/receipts/:id/items` - Lấy danh sách hàng hóa của phiếu

## Database Schema

### inventory_receipts
- `id` (UUID)
- `receipt_number` (VARCHAR) - Số phiếu
- `warehouse_id` (VARCHAR) - Mã kho
- `supplier_id` (VARCHAR) - Mã nhà cung cấp
- `receipt_date` (DATE) - Ngày nhập kho
- `warehouse_keeper_name` (VARCHAR) - Tên thủ kho
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### inventory_receipt_items
- `id` (UUID)
- `receipt_id` (UUID, FK)
- `product_id` (VARCHAR)
- `product_name` (VARCHAR)
- `quantity` (INTEGER)
- `unit` (VARCHAR) - Đơn vị tính
- `unit_price` (DECIMAL)
- `total_price` (DECIMAL)
- `batch_number` (VARCHAR)
- `expiration_date` (DATE)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Lưu ý

- Backend API URL được cấu hình qua environment variable `VITE_API_URL` (mặc định: `http://localhost:3000/api`)
- Đảm bảo backend đang chạy trước khi khởi động frontend
- Test frontend dùng Vitest với jsdom environment
