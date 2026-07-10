# BapEnglish — Parallel Testing & Performance Guide

Tài liệu này hướng dẫn toàn diện kiến thức, cấu hình và chiến lược thực thi **Kiểm thử song song (Parallel Testing)** trên toàn bộ kiến trúc **BapEnglish** (Next.js Frontend + NestJS Backend + PostgreSQL Database).

---

## 1. Kiến trúc Kiểm thử Song song

Dự án chia làm **3 tầng kiểm thử song song**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PARALLEL TESTING ARCHITECTURE                   │
│                                                                        │
│  [Layer 1: Unit & Component Tests]                                     │
│   ├── Frontend: Vitest (Multi-threading via Tinypool)                  │
│   └── Backend:  Jest (Worker Pool --maxWorkers=50%)                    │
│                                                                        │
│  [Layer 2: Backend Integration / API E2E Tests]                        │
│   └── Jest E2E + Transaction-isolated Database                         │
│                                                                        │
│  [Layer 3: End-to-End Fullstack UI Tests]                              │
│   └── Playwright (fullyParallel + Multi-browsers + CI Sharding)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1 — Parallel Unit & Component Testing

### A. Frontend (Vitest)
Vitest sử dụng cơ chế **worker threads** (`tinypool`) chạy song song mặc định trên tất cả lõi CPU sẵn có.

#### Cấu hình tối ưu trong `vitest.config.mts`:
```ts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    // Cấu hình parallel threads
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: process.env.CI ? 2 : undefined, // CI giới hạn 2 thread tránh OOM
        minThreads: 1,
      },
    },
  },
});
```

#### Lệnh chạy song song:
```bash
# Chạy toàn bộ unit test song song
npm run test

# Chạy song song ở chế độ watch khi dev
npm run test:watch
```

---

### B. Backend (Jest)
NestJS Backend sử dụng **Jest** cho unit testing (`backend/package.json`). Jest spawn các node worker processes song song theo từng file test.

#### Lệnh tối ưu đa luồng cho Backend:
```bash
cd backend

# Chạy song song tận dụng 50% số core CPU (tránh lag máy khi dev)
npx jest --maxWorkers=50%

# Chạy song song trên CI
npx jest --maxWorkers=2
```

---

## 3. Layer 2 & 3 — Cách ly Dữ liệu cho Kiểm thử Song song (Database Isolation)

Khi chạy song song nhiều test case có thao tác Ghi/Xóa trên **PostgreSQL**, nếu dùng chung 1 database sẽ dẫn đến xung đột dữ liệu (Race Condition / Deadlock).

Dưới đây là **3 chiến lược chuẩn** để giải quyết:

---

### Chiến lược 1: Transaction Rollback (Khuyên dùng cho Integration Test)
Mỗi test case được bọc trong một **Database Transaction**. Tất cả thao tác CRUD diễn ra bên trong transaction đó và tự động **ROLLBACK** khi test kết thúc.

```ts
// Ví dụ trong NestJS Integration Test
let prisma: PrismaService;

beforeEach(async () => {
  // Mở transaction độc lập cho mỗi test
  await prisma.$executeRawUnsafe('BEGIN');
});

afterEach(async () => {
  // Rollback toàn bộ thay đổi, giữ cho DB nguyên vẹn
  await prisma.$executeRawUnsafe('ROLLBACK');
});
```

---

### Chiến lược 2: Worker-Scoped Schema Isolation (Cho Playwright E2E)
Playwright cung cấp biến `TEST_WORKER_INDEX` (0, 1, 2...). Ta có thể tạo riêng **Mỗi Worker một Schema PostgreSQL độc lập** (`test_worker_0`, `test_worker_1`).

#### Cách cấu hình trong `e2e/global-setup.ts`:
```ts
import { test as setup } from '@playwright/test';

setup('isolate database per worker', async () => {
  const workerId = process.env.TEST_WORKER_INDEX ?? '0';
  const schemaName = `test_worker_${workerId}`;
  
  // Cập nhật DATABASE_URL trỏ vào schema riêng của worker
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}?schema=${schemaName}`;
});
```

---

## 4. Layer 3 — Parallel E2E UI Testing (Playwright)

File cấu hình [`playwright.config.ts`](file:///Users/andydo/Desktop/learning-english-ielts/playwright.config.ts) đã được bật `fullyParallel: true`.

### A. Chạy song song trên Máy cá nhân (Local Parallelism)
```bash
# Chạy toàn bộ E2E test song song trên tất cả CPU cores
npx playwright test

# Chạy song song với 4 workers cụ thể
npx playwright test --workers=4
```

### B. CI Sharding — Phân mảnh song song trên GitHub Actions
Khi bộ test E2E lớn dần (hàng trăm spec), thay vì chạy trên 1 máy ảo CI mất 15 phút, ta dùng **Playwright Sharding** chia thành 3 máy chạy song song cùng lúc (giảm thời gian xuống còn 5 phút).

#### Cấu hình GitHub Actions Workflow (`.github/workflows/e2e-parallel.yml`):
```yaml
name: Parallel E2E Tests (Sharding)

on:
  pull_request:
    branches: [main]

jobs:
  playwright-tests:
    name: E2E Test (Shard ${{ matrix.shard }}/${{ matrix.total-shards }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3]
        total-shards: [3]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests shard
        run: npx playwright test --shard=${{ matrix.shard }}/${{ matrix.total-shards }}

      - name: Upload Blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 1
```

---

## 5. Checklist Best Practices khi viết Test Song song

1. **Không bao giờ dùng ID cứng (Hardcoded ID) trong DB:**
   - ❌ `const userId = "user_123"` *(Dễ bị va chạm giữa các worker)*
   - ✅ Dùng CUID hoặc UUID ngẫu nhiên: `const userId = createId()`
2. **Không phụ thuộc vào thứ tự chạy của Test:**
   - Mọi test file (`*.spec.ts`) phải tự khởi tạo dữ liệu của riêng mình (`setup`) và tự dọn dẹp (`teardown`).
3. **Tránh chia sẻ state qua Global Variable / Static Class:**
   - Không lưu trạng thái đăng nhập vào biến global khi test song song. Sử dụng Playwright `storageState` độc lập cho từng user test case.
4. **Sử dụng `--maxWorkers=50%` trên máy local:**
   - Khi vừa dev vừa test, luôn giới hạn số worker để không làm quá tải CPU máy tính của bạn.
