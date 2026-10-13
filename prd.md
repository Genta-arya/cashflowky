# PRD — Aplikasi Cashflow & Utang Piutang Pribadi ("DuitKu")

> **Versi 2 (revisi):** aplikasi **pemakaian pribadi (single user)** dan menggunakan **JavaScript (JS/JSX), bukan TypeScript**.
> Nama kerja: **DuitKu** (boleh diganti). Bahasa UI: **Bahasa Indonesia**. Bahasa kode/nama variabel/DB: **Inggris**.
> Dokumen ini ditulis agar bisa dikerjakan **step by step oleh developer junior / AI model murah**. Ikuti urutan task di Bagian 10. Jangan melompat.

### Perubahan dari Versi 1
| Hal | Versi 1 | Versi 2 |
|---|---|---|
| Pengguna | Multi-user (register, userId di semua tabel) | **Single user**, tidak ada tabel User, tidak ada register, tidak ada `userId` |
| Bahasa | TypeScript | **JavaScript** (`.js` / `.jsx`) + `jsconfig.json` |
| Auth | Register + login banyak akun | **1 akun tetap** dari file `.env` (username + password ter-hash) |
| Validasi tipe | `tsc --noEmit` | Tidak ada. Validasi runtime pakai **Zod** |
| Pengaturan akun | Ubah nama/password via UI | Dihapus (ubah lewat `.env`) |

---

## 0. Cara Membaca Dokumen Ini (WAJIB untuk pelaksana)

1. Kerjakan **satu task per satu waktu**, sesuai urutan ID (T0.1, T0.2, ...).
2. Setiap task punya **Output** dan **Acceptance Criteria (AC)**. Jangan lanjut sebelum semua AC terpenuhi.
3. **Jangan menambah fitur, library, atau mengubah struktur folder** yang tidak tertulis di sini. Jika ada yang ambigu, pilih opsi paling sederhana dan catat di `docs/DECISIONS.md`.
4. Semua keputusan teknis sudah dibuat di dokumen ini. Tugasmu **mengeksekusi**, bukan mendesain ulang.
5. **Gunakan JavaScript biasa.** Dilarang membuat file `.ts` / `.tsx`, dilarang menambah `typescript` ke project.
6. Setelah tiap task jalankan `npm run lint`. Harus 0 error.
7. Commit per task dengan format: `feat(T3.2): tambah form transaksi`.

---

## 1. Ringkasan Produk

### 1.1 Tujuan
Web app **pribadi** untuk mencatat **pemasukan, pengeluaran**, serta mengelola **utang (yang harus dibayar)** dan **piutang (uang yang dipinjam orang lain)** dengan **jadwal jatuh tempo yang fleksibel** (tiap cicilan bisa beda tanggal dan beda nominal), lalu melihat kondisi keuangan lewat dashboard dan laporan.

### 1.2 Masalah yang Diselesaikan
- Utang/piutang sering lupa jatuh tempo.
- Satu utang bisa dicicil dengan tanggal & nominal berbeda-beda, aplikasi biasa tidak mendukung.
- Tidak ada gambaran jelas: uang masuk/keluar, saldo, dan kewajiban ke depan.

### 1.3 Pengguna
**Satu orang (pemilik)**. Tidak ada registrasi, tidak ada role, tidak ada kolaborasi. Aplikasi tetap dilindungi login supaya aman jika di-deploy ke internet.

### 1.4 Di Luar Scope MVP (JANGAN dikerjakan dulu)
Multi-user, register, transfer antar dompet, budgeting, transaksi berulang otomatis, notifikasi email/WhatsApp, multi-mata-uang, import/export, upload struk, aplikasi mobile native. (Lihat Bagian 11 untuk Fase 2.)

---

## 2. Tech Stack (FINAL, jangan diganti)

| Kebutuhan | Pilihan |
|---|---|
| Framework | Next.js **App Router**, fullstack, **JavaScript (JSX)** |
| ORM | Prisma |
| Database | MySQL 8 |
| Styling | Tailwind CSS + **shadcn/ui** (mode JavaScript, `tsx: false`) |
| Form & validasi | React Hook Form + **Zod** (skema Zod dipakai bersama di client & server) |
| Data fetching client | TanStack Query (React Query) |
| Chart | Recharts |
| Tanggal | `date-fns` (+ locale `id`) |
| Auth | `bcryptjs` (cek password) + `jose` (JWT) di **httpOnly cookie** |
| Toast | `sonner` |
| Icon | `lucide-react` |
| Test | Vitest (hanya untuk service/logic penting) |

Catatan:
- Gunakan **versi stabil terbaru saat setup**, lalu **kunci versi** di `package.json` (tanpa `^`).
- Saat membuat project: `npx create-next-app@latest` → pilih **TypeScript: No**, ESLint: Yes, Tailwind: Yes, `src/` directory: Yes, App Router: Yes, import alias `@/*`.
- Saat `npx shadcn@latest init`, pastikan file `components.json` berisi `"tsx": false` sehingga komponen dihasilkan sebagai `.jsx`.
- Karena tanpa TypeScript, **semua input wajib divalidasi dengan Zod** dan komponen boleh diberi komentar JSDoc singkat untuk menjelaskan props.

---

## 3. Aturan Arsitektur (ringkas & tegas)

```
Browser (React, TanStack Query)
        │  fetch JSON
        ▼
src/app/api/**/route.js   ← "tipis": cek auth → validasi Zod → panggil service → return JSON
        ▼
src/server/services/*.js  ← SEMUA logika bisnis + akses Prisma ada di sini
        ▼
Prisma → MySQL
```

**Aturan keras:**
1. Route handler **tidak boleh** berisi query Prisma langsung. Selalu lewat service.
2. **Semua endpoint `/api/*` (kecuali login) wajib dibungkus `withAuth`**. Tanpa cookie sesi valid → 401.
3. Operasi yang mengubah >1 tabel **wajib** dibungkus `prisma.$transaction`.
4. Semua input divalidasi dengan Zod di server, walaupun sudah divalidasi di client.
5. Uang: kolom DB `Decimal(15,2)`. Di service, konversi ke `number` lewat helper `toNumber()` sebelum dikirim ke client (nilai `Decimal` Prisma tidak bisa langsung di-JSON). Format tampilan lewat `formatRupiah()`.
6. Tanggal "tanpa jam" (tanggal transaksi, jatuh tempo) pakai `@db.Date`. Zona waktu: **Asia/Jakarta (WIB)**. "Hari ini" dihitung lewat helper `todayWIB()`.
7. Status **"terlambat" (overdue) TIDAK disimpan di DB**. Dihitung: `dueDate < todayWIB()` dan cicilan belum lunas.
8. Komponen yang memakai hook/state/event wajib diawali `"use client"` di baris pertama.
9. Import menggunakan alias `@/` (dikonfigurasi di `jsconfig.json`).

### 3.1 Format Response API (seragam)

Sukses:
```json
{ "success": true, "data": { } }
```
List dengan paginasi:
```json
{ "success": true, "data": [ ], "meta": { "page": 1, "pageSize": 20, "total": 134 } }
```
Gagal:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Data tidak valid", "fields": { "amount": "Harus lebih dari 0" } } }
```
Kode error: `UNAUTHORIZED` (401), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `CONFLICT` (409), `INTERNAL` (500).

---

## 4. Struktur Folder (FINAL)

```
duitku/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.js                        ← data default (+ opsi --demo)
├─ scripts/
│  └─ hash-password.js               ← cetak bcrypt hash untuk .env
├─ docs/
│  └─ DECISIONS.md
├─ src/
│  ├─ app/
│  │  ├─ login/page.jsx
│  │  ├─ (app)/layout.jsx            ← sidebar + topbar + bottom nav
│  │  ├─ (app)/dashboard/page.jsx
│  │  ├─ (app)/transactions/page.jsx
│  │  ├─ (app)/debts/page.jsx
│  │  ├─ (app)/debts/[id]/page.jsx
│  │  ├─ (app)/debts/new/page.jsx
│  │  ├─ (app)/reports/page.jsx
│  │  ├─ (app)/settings/page.jsx     ← tab: Dompet, Kategori, Kontak
│  │  ├─ api/auth/{login,logout,me}/route.js
│  │  ├─ api/accounts/route.js, api/accounts/[id]/route.js
│  │  ├─ api/categories/...  api/contacts/...  api/transactions/...
│  │  ├─ api/debts/route.js, api/debts/[id]/route.js, api/debts/upcoming/route.js
│  │  ├─ api/debts/[id]/installments/route.js
│  │  ├─ api/installments/[id]/route.js
│  │  ├─ api/installments/[id]/payments/route.js
│  │  ├─ api/payments/[id]/route.js
│  │  ├─ api/dashboard/summary/route.js
│  │  └─ api/reports/{cashflow,category}/route.js
│  ├─ components/
│  │  ├─ ui/                ← hasil generate shadcn (jangan diedit manual kecuali perlu)
│  │  ├─ layout/            ← Sidebar, Topbar, BottomNav, PageHeader
│  │  ├─ common/            ← MoneyInput, DatePicker, EmptyState, ConfirmDialog, StatCard, AmountText, StatusBadge, ResponsiveDialog
│  │  ├─ transactions/
│  │  ├─ debts/
│  │  ├─ dashboard/
│  │  └─ reports/
│  ├─ lib/
│  │  ├─ prisma.js          ← singleton PrismaClient
│  │  ├─ auth.js            ← cek kredensial, sign/verify JWT, getSession()
│  │  ├─ api.js             ← helper ok(), fail(), withAuth(), handleError(), AppError
│  │  ├─ format.js          ← formatRupiah(), formatDate(), formatRelativeDue()
│  │  ├─ date.js            ← todayWIB(), startOfMonthWIB(), dll
│  │  └─ utils.js           ← cn(), toNumber()
│  ├─ server/services/
│  │  ├─ account.service.js
│  │  ├─ category.service.js
│  │  ├─ contact.service.js
│  │  ├─ transaction.service.js
│  │  ├─ debt.service.js
│  │  ├─ report.service.js
│  │  └─ dashboard.service.js
│  ├─ schemas/              ← Zod: account, category, contact, transaction, debt, auth, common (.js)
│  ├─ hooks/                ← useTransactions, useDebts, ... (membungkus TanStack Query)
│  └─ middleware.js         ← proteksi halaman → redirect ke /login
├─ jsconfig.json            ← { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
├─ .env.example
└─ package.json
```

`.env.example`:
```
DATABASE_URL="mysql://user:password@localhost:3306/duitku"
JWT_SECRET="isi-dengan-string-acak-minimal-32-karakter"
APP_USERNAME="admin"
# Buat dengan: npm run hash-password -- "passwordkamu"
APP_PASSWORD_HASH="$2a$10$...hasil-hash..."
```
> Catatan: karakter `$` pada hash bcrypt di file `.env` Next.js harus di-escape menjadi `\$` atau hash dibungkus tanda kutip tunggal. Catat cara yang dipakai di `README.md`.

Script `package.json` wajib ada: `dev`, `build`, `start`, `lint`, `test`, `db:migrate`, `db:seed`, `hash-password`.

---

## 5. Model Data (Prisma schema — salin apa adanya)

Tidak ada tabel `User` dan tidak ada kolom `userId` (aplikasi single user).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum AccountType {
  CASH
  BANK
  EWALLET
}

enum CategoryType {
  INCOME
  EXPENSE
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum TransactionSource {
  MANUAL
  DEBT_PAYMENT
}

enum DebtType {
  PAYABLE      // Utang: saya yang harus bayar
  RECEIVABLE   // Piutang: orang lain yang harus bayar ke saya
}

enum DebtStatus {
  ACTIVE
  PAID
  CANCELED
}

enum InstallmentStatus {
  PENDING
  PARTIAL
  PAID
}

model Account {
  id             String      @id @default(cuid())
  name           String      @unique @db.VarChar(100)
  type           AccountType @default(CASH)
  initialBalance Decimal     @default(0) @db.Decimal(15, 2)
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  transactions Transaction[]
  payments     DebtPayment[]
}

model Category {
  id        String       @id @default(cuid())
  name      String       @db.VarChar(100)
  type      CategoryType
  color     String       @default("#64748b") @db.VarChar(7)
  isSystem  Boolean      @default(false) // kategori sistem tidak boleh dihapus
  createdAt DateTime     @default(now())

  transactions Transaction[]

  @@unique([name, type])
  @@index([type])
}

model Contact {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  phone     String?  @db.VarChar(30)
  note      String?  @db.VarChar(255)
  createdAt DateTime @default(now())

  debts Debt[]
}

model Transaction {
  id         String            @id @default(cuid())
  accountId  String
  categoryId String?
  type       TransactionType
  amount     Decimal           @db.Decimal(15, 2)
  date       DateTime          @db.Date
  note       String?           @db.VarChar(255)
  source     TransactionSource @default(MANUAL)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  account     Account      @relation(fields: [accountId], references: [id], onDelete: Restrict)
  category    Category?    @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  debtPayment DebtPayment?

  @@index([date])
  @@index([type, date])
  @@index([accountId])
}

model Debt {
  id              String     @id @default(cuid())
  contactId       String
  type            DebtType
  title           String     @db.VarChar(150)
  principalAmount Decimal    @db.Decimal(15, 2) // pokok (info)
  totalAmount     Decimal    @db.Decimal(15, 2) // = jumlah semua cicilan (dihitung ulang otomatis)
  startDate       DateTime   @db.Date
  status          DebtStatus @default(ACTIVE)
  note            String?    @db.VarChar(500)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  contact      Contact           @relation(fields: [contactId], references: [id], onDelete: Restrict)
  installments DebtInstallment[]

  @@index([type, status])
}

model DebtInstallment {
  id         String            @id @default(cuid())
  debtId     String
  sequence   Int               // urutan 1,2,3 (urut berdasar dueDate)
  dueDate    DateTime          @db.Date
  amount     Decimal           @db.Decimal(15, 2)
  paidAmount Decimal           @default(0) @db.Decimal(15, 2)
  status     InstallmentStatus @default(PENDING)
  paidAt     DateTime?         @db.Date // tanggal pelunasan penuh
  note       String?           @db.VarChar(255)

  debt     Debt          @relation(fields: [debtId], references: [id], onDelete: Cascade)
  payments DebtPayment[]

  @@unique([debtId, sequence])
  @@index([dueDate, status])
}

model DebtPayment {
  id            String   @id @default(cuid())
  installmentId String
  accountId     String
  transactionId String   @unique // transaksi kas yang otomatis dibuat
  amount        Decimal  @db.Decimal(15, 2)
  paidDate      DateTime @db.Date
  note          String?  @db.VarChar(255)
  createdAt     DateTime @default(now())

  installment DebtInstallment @relation(fields: [installmentId], references: [id], onDelete: Cascade)
  account     Account         @relation(fields: [accountId], references: [id], onDelete: Restrict)
  transaction Transaction     @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  @@index([installmentId])
}
```

### 5.1 Seed Data (`prisma/seed.js`)
Seed **wajib dijalankan sekali** setelah migrasi (dan harus **idempotent** → pakai `upsert`, aman dijalankan berulang):
- Dompet: `Tunai` (CASH).
- Kategori INCOME: Gaji, Bonus, Usaha, Lainnya.
- Kategori EXPENSE: Makan & Minum, Transport, Tagihan, Belanja, Kesehatan, Hiburan, Pendidikan, Lainnya.
- Kategori sistem (`isSystem=true`): INCOME → **Penerimaan Piutang**, EXPENSE → **Pembayaran Utang**. (Wajib ada, dipakai logika pembayaran cicilan.)

Opsi `node prisma/seed.js --demo` menambahkan data contoh: dompet `BCA` & `GoPay`, 20 transaksi di 3 bulan terakhir, 2 utang (satu 3 cicilan dengan tanggal & nominal berbeda, satu 1 cicilan) dan 2 piutang (salah satunya sudah terlambat). Hanya untuk pengembangan.

> Jika kategori sistem tidak ditemukan saat bayar cicilan, service harus melempar `AppError('INTERNAL', 'Kategori sistem belum di-seed. Jalankan npm run db:seed')`.

---

## 6. Aturan Bisnis (inti aplikasi — baca teliti)

### 6.1 Saldo Dompet
`saldo = initialBalance + Σ(INCOME) − Σ(EXPENSE)` dari semua transaksi dompet tersebut. **Dihitung saat query, tidak disimpan.**

### 6.2 Transaksi Manual
- `amount > 0`, `date` wajib, `accountId` wajib, `categoryId` wajib dan **tipe kategori harus sama dengan tipe transaksi**.
- Transaksi dengan `source = DEBT_PAYMENT` **tidak boleh diedit/dihapus** lewat endpoint transaksi. Harus lewat penghapusan pembayaran di halaman utang (409 `CONFLICT`).

### 6.3 Utang/Piutang dengan Jatuh Tempo Dinamis
Konsep: satu **Debt** punya **1 sampai banyak Installment**. Tiap installment punya `dueDate` dan `amount` sendiri. Utang "sekali bayar" = 1 installment.

- `totalAmount` = Σ `amount` semua installment (dihitung ulang tiap installment ditambah/diubah/dihapus).
- `principalAmount` = pokok pinjaman (informasi). Bunga/selisih = `totalAmount − principalAmount` (tampilkan bila > 0).
- Installment diurutkan berdasarkan `dueDate`, `sequence` di-renumber 1..n setiap perubahan.
- Minimal 1 installment per debt. Tidak boleh menghapus installment terakhir.
- Installment **boleh diedit/dihapus hanya jika `paidAmount = 0`**. Menambah installment baru selalu boleh (untuk kasus perpanjangan/restrukturisasi).
- Tanggal `dueDate` boleh lampau (untuk pencatatan utang lama).

### 6.4 Pembayaran Cicilan
Endpoint: `POST /api/installments/:id/payments` dengan `{ amount, accountId, paidDate, note? }`.

Langkah di dalam **satu `prisma.$transaction`**:
1. Validasi installment ada; `amount > 0`; `amount ≤ (installment.amount − installment.paidAmount)` (tidak boleh kelebihan bayar); debt berstatus `ACTIVE`; dompet aktif.
2. Buat `Transaction`:
   - Debt `PAYABLE` → `type = EXPENSE`, kategori sistem "Pembayaran Utang".
   - Debt `RECEIVABLE` → `type = INCOME`, kategori sistem "Penerimaan Piutang".
   - `source = DEBT_PAYMENT`, `note` otomatis: `Bayar utang: {title} (cicilan ke-{sequence})` / `Terima piutang: ...`.
3. Buat `DebtPayment` yang menunjuk ke transaksi tersebut.
4. Update installment: `paidAmount += amount`; status = `PAID` bila `paidAmount == amount` (isi `paidAt`), selain itu `PARTIAL`.
5. Jika semua installment `PAID` → `debt.status = PAID`.

Hapus pembayaran (`DELETE /api/payments/:id`), dalam satu transaksi: hapus `DebtPayment` → hapus `Transaction` terkait → kurangi `paidAmount` installment → hitung ulang status installment (`PENDING`/`PARTIAL`/`PAID`, kosongkan `paidAt` jika bukan PAID) → set `debt.status = ACTIVE` bila sebelumnya PAID.

> Tip untuk pelaksana: hitung uang dengan `Prisma.Decimal` di dalam service (jangan `number`) agar tidak ada error pembulatan; ubah ke `number` hanya saat membentuk respons.

### 6.5 Status Turunan (dihitung, bukan disimpan)
Untuk tiap installment yang belum `PAID`:
- `daysLeft = dueDate − todayWIB()` (dalam hari)
- `OVERDUE` bila `daysLeft < 0`
- `DUE_SOON` bila `0 ≤ daysLeft ≤ 7`
- `UPCOMING` bila `daysLeft > 7`

Untuk Debt: sisa = `totalAmount − Σ paidAmount`. Status tampil "Terlambat" bila ada installment OVERDUE.

### 6.6 Penghapusan
- Dompet: tidak boleh dihapus jika punya transaksi → sarankan "Nonaktifkan" (`isActive=false`). Dompet nonaktif tidak muncul di dropdown input baru.
- Kategori: tidak boleh dihapus/diubah jika `isSystem` (409). Jika dipakai transaksi, transaksi tersebut jadi "Tanpa kategori" (sesuai `SetNull`).
- Kontak: tidak boleh dihapus jika punya debt (409).
- Debt: boleh dihapus **hanya jika belum ada pembayaran**. Jika sudah ada pembayaran, hanya bisa `CANCELED`.

### 6.7 Cashflow di Laporan/Dashboard
- Pemasukan & pengeluaran **mencakup** transaksi `DEBT_PAYMENT`.
- Di halaman laporan sediakan toggle **"Sertakan pembayaran utang/piutang"** (default: aktif). Bila dimatikan, filter `source = MANUAL`.

---

## 7. Kebutuhan Fitur (Functional Requirements)

Prioritas: **P0** = wajib MVP, **P1** = sebaiknya ada di MVP.

### F1. Autentikasi Sederhana (P0)
- F1.1 Satu akun tetap dari `.env` (`APP_USERNAME`, `APP_PASSWORD_HASH`). Tidak ada register.
- F1.2 Login (`POST /api/auth/login`): cocokkan username & `bcrypt.compare` password → set cookie `session` (JWT, httpOnly, sameSite=lax, secure di production, 30 hari). Pesan error generik: "Username atau password salah".
- F1.3 Logout → hapus cookie.
- F1.4 `GET /api/auth/me` → `{ username }` bila sesi valid.
- F1.5 `middleware.js`: akses halaman `(app)` tanpa sesi → redirect `/login`. Sudah login membuka `/login` → redirect `/dashboard`. (Middleware hanya cek keberadaan & validitas JWT dengan `jose`, tanpa akses database.)
- F1.6 Script `npm run hash-password -- "teks"` mencetak bcrypt hash untuk `.env`.

### F2. Dompet / Rekening (P0) — di Settings
- CRUD dompet (nama, tipe, saldo awal), nonaktifkan.
- Daftar menampilkan saldo saat ini.

### F3. Kategori (P0) — di Settings
- CRUD kategori per tipe (pemasukan/pengeluaran), pilih warna dari 10 preset.
- Kategori sistem terkunci (tidak bisa hapus/ubah).

### F4. Transaksi (P0)
- F4.1 Tambah transaksi cepat (tombol "+" global): tipe (toggle Pemasukan/Pengeluaran), nominal, tanggal (default hari ini), dompet, kategori (terfilter sesuai tipe), catatan.
- F4.2 Daftar transaksi dengan paginasi (20/halaman), dikelompokkan per tanggal.
- F4.3 Filter: rentang tanggal (preset: Bulan ini, Bulan lalu, 30 hari, Kustom), tipe, dompet, kategori, pencarian teks catatan.
- F4.4 Edit & hapus (dengan konfirmasi). Ikon gembok untuk transaksi `DEBT_PAYMENT`.
- F4.5 Ringkasan di atas daftar (sesuai filter): total pemasukan, total pengeluaran, selisih.

### F5. Kontak (P0) — di Settings dan inline saat buat utang
- CRUD kontak (nama wajib, telepon opsional, catatan opsional).
- Saat membuat utang, bisa memilih kontak atau "+ Tambah kontak baru" (dialog kecil).

### F6. Utang & Piutang (P0)
- F6.1 **Daftar** dengan 2 tab: **Utang Saya** (PAYABLE) & **Piutang Saya** (RECEIVABLE). Tiap kartu: judul, nama kontak, total, sisa, progress bar, jatuh tempo terdekat yang belum lunas, badge status.
- F6.2 Filter: status (Aktif / Lunas / Dibatalkan / Terlambat), kontak, urutkan (jatuh tempo terdekat, sisa terbesar, terbaru).
- F6.3 **Buat utang/piutang** (halaman `/debts/new`):
  - Tipe (Utang / Piutang), kontak, judul, pokok, tanggal mulai, catatan.
  - **Jadwal Jatuh Tempo (dinamis):** daftar baris `[tanggal] [nominal] [catatan]` dengan tombol "+ Tambah baris" dan hapus baris.
  - **Generator cepat:** input "Jumlah cicilan" + "Tanggal cicilan pertama" + "Interval (bulanan/mingguan)" → tombol "Bagi rata" mengisi baris otomatis (selisih pembulatan masuk ke cicilan terakhir). Hasilnya tetap bisa diedit manual per baris.
  - Total otomatis terhitung di bawah daftar, plus selisih terhadap pokok (info bunga).
  - Validasi: minimal 1 baris, semua nominal > 0, semua tanggal terisi.
- F6.4 **Detail** (`/debts/[id]`): header info + ringkasan (total, terbayar, sisa), tabel jadwal cicilan (no, jatuh tempo, nominal, terbayar, sisa, status, aksi), riwayat pembayaran.
- F6.5 Aksi di detail: **Bayar/Terima** (dialog: nominal default = sisa cicilan, dompet, tanggal, catatan), edit cicilan, hapus cicilan, tambah cicilan, hapus pembayaran, edit info utang, batalkan utang, hapus utang.
- F6.6 Aturan di Bagian 6.3 – 6.6 berlaku.

### F7. Pengingat Jatuh Tempo (P0, in-app saja)
- Widget "Jatuh Tempo Terdekat" di dashboard (gabungan utang & piutang, 30 hari ke depan + yang sudah terlambat), diurutkan `dueDate` ascending.
- Badge angka merah di menu "Utang & Piutang" = jumlah installment OVERDUE + DUE_SOON.
- `GET /api/debts/upcoming?days=30`.

### F8. Dashboard (P0)
Lihat desain di Bagian 8.5. Parameter `month=YYYY-MM` (default bulan berjalan).

### F9. Laporan (P1)
- Laporan Cashflow: grafik bar pemasukan vs pengeluaran per hari/bulan + tabel total.
- Laporan Kategori: donut + tabel persentase untuk pengeluaran / pemasukan.
- Filter: rentang tanggal, dompet, toggle sertakan pembayaran utang/piutang.

---

## 8. Desain Frontend

### 8.1 Prinsip
- **Mobile-first** (kemungkinan besar dibuka dari HP), tetap nyaman di desktop.
- Angka uang selalu **rata kanan**, font tabular (`tabular-nums`).
- Pemasukan = hijau, pengeluaran = merah, jangan hanya andalkan warna (sertakan tanda `+`/`−`).
- Setiap halaman wajib punya 3 state: **loading** (skeleton), **empty** (EmptyState dengan ajakan aksi), **error** (pesan + tombol "Coba lagi").
- Aksi merusak (hapus) selalu pakai `ConfirmDialog`.

### 8.2 Design Tokens
| Token | Nilai (Tailwind) | Dipakai untuk |
|---|---|---|
| Primary | `indigo-600` | tombol utama, link aktif |
| Income | `emerald-600` / bg `emerald-50` | pemasukan, piutang lunas |
| Expense | `rose-600` / bg `rose-50` | pengeluaran, terlambat |
| Warning | `amber-500` / bg `amber-50` | jatuh tempo ≤ 7 hari |
| Info | `sky-600` | piutang |
| Netral | `slate-*` | teks, border, background |
| Radius | `rounded-xl` kartu, `rounded-lg` input/tombol | |
| Font | Inter (via `next/font`) | |
| Background app | `slate-50` (light). Dark mode **tidak** di MVP | |

### 8.3 Format Tampilan
- Uang: `Rp 1.250.000` (`Intl.NumberFormat('id-ID')`, tanpa desimal bila `.00`).
- Tanggal: `13 Okt 2026`. Tanggal relatif untuk jatuh tempo: "Hari ini", "Besok", "3 hari lagi", "Terlambat 2 hari".
- Bulan: `Oktober 2026`.

### 8.4 Layout Aplikasi `(app)/layout.jsx`
**Desktop (≥ 1024px):** sidebar kiri 240px tetap, konten kanan max-width 1200px.
**Mobile (< 1024px):** topbar + **bottom navigation** 5 item, tombol "+" melayang di tengah bawah.

Menu: Dashboard, Transaksi, Utang & Piutang (+badge), Laporan, Pengaturan. Tombol **Keluar** di sidebar (desktop) / menu ikon di topbar (mobile).

```
DESKTOP
┌──────────┬───────────────────────────────────────────────┐
│ DuitKu   │  Judul Halaman                [+ Transaksi]   │
│          ├───────────────────────────────────────────────┤
│ Dashboard│                                               │
│ Transaksi│                 KONTEN                        │
│ Utang(3) │                                               │
│ Laporan  │                                               │
│ Setelan  │                                               │
│ [Keluar] │                                               │
└──────────┴───────────────────────────────────────────────┘

MOBILE
┌──────────────────────┐
│ Dashboard     [Keluar]│
├──────────────────────┤
│       KONTEN         │
│                      │
├──────────────────────┤
│ 🏠  💸  ( + )  🤝  ⚙ │
└──────────────────────┘
```

### 8.5 Halaman Dashboard
```
[ Pilih bulan:  ◀ Oktober 2026 ▶ ]

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total Saldo │ │ Pemasukan   │ │ Pengeluaran │ │ Selisih     │
│ Rp 12.500k  │ │ + Rp 8.000k │ │ − Rp 5.200k │ │ + Rp 2.800k │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌───────────────────────────┐ ┌───────────────────────────┐
│ Utang Saya (sisa)         │ │ Piutang Saya (sisa)       │
│ Rp 3.000.000   2 aktif    │ │ Rp 1.500.000   2 aktif    │
│ 1 terlambat               │ │                           │
└───────────────────────────┘ └───────────────────────────┘

┌───────────────────────────────────────────────┐
│ Tren 6 bulan (bar: pemasukan vs pengeluaran)  │
└───────────────────────────────────────────────┘

┌────────────────────────┐ ┌────────────────────────────┐
│ Pengeluaran per kategori│ │ Jatuh Tempo Terdekat       │
│ (donut + legend top 5)  │ │ ● Terlambat 2 hari  Budi   │
│                         │ │   Utang Motor  Rp 500.000  │
│                         │ │ ● 3 hari lagi  Sinta       │
│                         │ │   Piutang      Rp 750.000  │
└────────────────────────┘ └────────────────────────────┘

┌───────────────────────────────────────────────┐
│ Transaksi Terbaru (5)               Lihat semua│
└───────────────────────────────────────────────┘
```
Mobile: semua kartu menumpuk 1 kolom (stat card 2 kolom).

### 8.6 Halaman Transaksi
```
Transaksi                                   [+ Tambah]
[Bulan ini ▾] [Semua tipe ▾] [Semua dompet ▾] [Kategori ▾] [🔍 cari...]
┌──────────────────────────────────────────────────────┐
│ Pemasukan +8.000.000 │ Pengeluaran −5.200.000 │ Selisih +2.800.000 │
└──────────────────────────────────────────────────────┘
13 Okt 2026
  🍜 Makan & Minum   Makan siang • Tunai        − Rp 35.000
  💼 Gaji            Gaji Oktober • BCA        + Rp 8.000.000
12 Okt 2026
  🔒 Pembayaran Utang  Bayar utang: Motor (ke-2) − Rp 500.000
[ ◀ Sebelumnya ]  Halaman 1 / 7  [ Berikutnya ▶ ]
```
- Klik baris → buka dialog edit. Mobile: dialog tampil sebagai bottom sheet.

### 8.7 Form Tambah/Edit Transaksi (Dialog)
```
┌─ Tambah Transaksi ─────────────┐
│ [ Pemasukan | Pengeluaran ]    │  ← segmented toggle
│ Nominal   [ Rp 0            ]  │  ← MoneyInput (auto titik ribuan)
│ Tanggal   [ 13 Okt 2026  📅 ]  │
│ Dompet    [ BCA           ▾ ]  │
│ Kategori  [ Makan & Minum ▾ ]  │
│ Catatan   [                 ]  │
│        [Batal]  [Simpan]       │
└────────────────────────────────┘
```

### 8.8 Halaman Daftar Utang & Piutang
```
Utang & Piutang                        [+ Tambah]
[ Utang Saya (3) ] [ Piutang Saya (2) ]
[Status: Aktif ▾] [Kontak ▾] [Urutkan: Jatuh tempo ▾]

┌────────────────────────────────────────────────────┐
│ Cicilan Motor            [Terlambat]               │
│ Budi Santoso                                       │
│ Total Rp 6.000.000 • Sisa Rp 3.500.000             │
│ ████████░░░░░░  42%                                │
│ Jatuh tempo berikutnya: Terlambat 2 hari • Rp 500k │
└────────────────────────────────────────────────────┘
```
Warna badge: Terlambat = rose, Segera (≤7 hari) = amber, Aktif = slate, Lunas = emerald, Dibatalkan = abu-abu.

### 8.9 Halaman Buat Utang/Piutang (`/debts/new`)
```
Tambah Utang / Piutang
Tipe      ( • Utang saya )  ( Piutang saya )
Kontak    [ Pilih kontak ▾ ]  [+ Baru]
Judul     [ Pinjaman modal usaha        ]
Pokok     [ Rp 5.000.000 ]    Tanggal mulai [ 01 Okt 2026 ]
Catatan   [                              ]

── Jadwal Jatuh Tempo ───────────────────────────
Bagi rata: Jumlah [3]  Mulai [01 Nov 2026]  [Bulanan ▾]  [Bagi rata]

 #  Tanggal Jatuh Tempo   Nominal          Catatan
 1  [ 01 Nov 2026 ]      [ Rp 1.700.000 ]  [        ]  🗑
 2  [ 15 Des 2026 ]      [ Rp 1.700.000 ]  [        ]  🗑
 3  [ 10 Jan 2027 ]      [ Rp 1.600.000 ]  [        ]  🗑
 [ + Tambah baris ]

 Total jadwal: Rp 5.000.000   (Bunga/selisih: Rp 0)
                                  [Batal] [Simpan]
```
Mobile: tiap baris cicilan menjadi kartu kecil bertumpuk. Gunakan `useFieldArray` dari React Hook Form untuk baris dinamis.

### 8.10 Halaman Detail Utang (`/debts/[id]`)
```
← Utang & Piutang
Cicilan Motor                         [Edit] [⋯ Batalkan/Hapus]
Utang • Budi Santoso • Mulai 01 Okt 2026

┌ Total ───┐ ┌ Terbayar ─┐ ┌ Sisa ─────┐
│ 6.000.000│ │ 2.500.000 │ │ 3.500.000 │   ████████░░ 42%
└──────────┘ └───────────┘ └───────────┘

Jadwal Cicilan                         [+ Tambah cicilan]
 #  Jatuh Tempo   Nominal   Terbayar  Sisa     Status     Aksi
 1  01 Nov 2026   1.500k    1.500k    0        ✔ Lunas    —
 2  15 Des 2026   2.000k    1.000k    1.000k   Sebagian   [Bayar] [✎]
 3  10 Jan 2027   2.500k    0         2.500k   Segera     [Bayar] [✎] [🗑]

Riwayat Pembayaran
 20 Nov 2026  Cicilan 1  BCA    Rp 1.500.000   [🗑]
```
Tombol "Bayar" untuk PAYABLE, label "Terima" untuk RECEIVABLE.

### 8.11 Halaman Laporan
- Filter di atas (rentang tanggal, dompet, toggle).
- Tab "Cashflow": bar chart + tabel ringkasan per periode.
- Tab "Kategori": pilihan Pengeluaran/Pemasukan, donut + tabel (kategori, total, %).

### 8.12 Halaman Pengaturan
Tab: **Dompet** | **Kategori** | **Kontak**. Setiap tab: daftar + tombol tambah + aksi edit/hapus/nonaktif.

### 8.13 Komponen Reusable (buat dulu sebelum halaman)
| Komponen | Fungsi |
|---|---|
| `MoneyInput` | Input nominal; tampilan `1.250.000`, nilai form berupa `number` |
| `DatePicker` | Pilih tanggal (shadcn Calendar + Popover), locale `id` |
| `AmountText` | Menampilkan uang dengan warna & tanda (+/−) opsional |
| `StatCard` | Kartu angka ringkas dengan label & ikon |
| `StatusBadge` | Badge status utang/cicilan (OVERDUE, DUE_SOON, dll.) |
| `EmptyState` | Ikon + teks + tombol aksi |
| `ConfirmDialog` | Konfirmasi hapus |
| `PageHeader` | Judul + slot aksi |
| `ResponsiveDialog` | Dialog di desktop, bottom sheet (Drawer) di mobile |

Setiap komponen diberi komentar JSDoc singkat untuk props, contoh:
```jsx
/**
 * @param {{ value: number, onChange: (v: number) => void, placeholder?: string }} props
 */
```

---

## 9. Spesifikasi API

Semua endpoint **memerlukan sesi login** (`withAuth`) kecuali `POST /api/auth/login`.

### 9.1 Auth
| Method | Path | Body | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | `{username,password}` | Set cookie sesi |
| POST | `/api/auth/logout` | – | Hapus cookie |
| GET | `/api/auth/me` | – | `{ username }` |

### 9.2 Master Data
| Method | Path | Keterangan |
|---|---|---|
| GET/POST | `/api/accounts` | List (+saldo saat ini) / buat |
| PATCH/DELETE | `/api/accounts/:id` | Ubah (termasuk `isActive`) / hapus (aturan 6.6) |
| GET/POST | `/api/categories` | Query `?type=INCOME\|EXPENSE` |
| PATCH/DELETE | `/api/categories/:id` | Aturan 6.6 |
| GET/POST | `/api/contacts` | |
| PATCH/DELETE | `/api/contacts/:id` | Aturan 6.6 |

### 9.3 Transaksi
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/transactions` | Query: `from,to,type,accountId,categoryId,q,page,pageSize`. Respons berisi `data[]`, `meta`, dan `summary{income,expense,net}` |
| POST | `/api/transactions` | Buat (source = MANUAL) |
| GET/PATCH/DELETE | `/api/transactions/:id` | Aturan 6.2 |

### 9.4 Utang
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/debts` | Query: `type,status,contactId,overdue,sort` → tiap item menyertakan `paidAmount, remainingAmount, nextDue{dueDate,amount,state}` |
| POST | `/api/debts` | Body termasuk `installments[]` (min 1) |
| GET | `/api/debts/:id` | Detail + installments + payments |
| PATCH | `/api/debts/:id` | Ubah info / status `CANCELED` |
| DELETE | `/api/debts/:id` | Hanya jika belum ada pembayaran |
| GET | `/api/debts/upcoming?days=30` | Installment belum lunas yang overdue + jatuh tempo ≤ N hari |
| POST | `/api/debts/:id/installments` | Tambah cicilan `{dueDate,amount,note?}` |
| PATCH/DELETE | `/api/installments/:id` | Hanya jika `paidAmount = 0` |
| POST | `/api/installments/:id/payments` | Bayar (aturan 6.4) |
| DELETE | `/api/payments/:id` | Batalkan pembayaran (aturan 6.4) |

### 9.5 Dashboard & Laporan
| Method | Path | Respons |
|---|---|---|
| GET | `/api/dashboard/summary?month=YYYY-MM` | `{ totalBalance, income, expense, net, payableRemaining, receivableRemaining, payableOverdueCount, receivableOverdueCount, trend6m:[{month,income,expense}], expenseByCategory:[{name,color,total}], recentTransactions[] }` |
| GET | `/api/reports/cashflow?from&to&groupBy=day\|month&accountId&includeDebt=true` | `[{period,income,expense,net}]` |
| GET | `/api/reports/category?from&to&type&accountId&includeDebt=true` | `[{categoryId,name,color,total,percent}]` |

---

## 10. Rencana Pengerjaan (Task Breakdown)

Legenda: ☐ = belum. Tiap task kecil dan punya bukti selesai.

### FASE 0 — Fondasi Proyek
- ☐ **T0.1** Inisialisasi Next.js dengan **JavaScript** (TypeScript: No, App Router, Tailwind, ESLint, `src/` dir, alias `@/*`). Pastikan ada `jsconfig.json` dengan alias `@/*`.
  *AC:* `npm run dev` jalan, halaman default tampil, tidak ada file `.ts/.tsx`.
- ☐ **T0.2** Install & init shadcn/ui (mode JS, `"tsx": false`); tambahkan komponen: button, input, label, select, dialog, drawer, tabs, table, badge, card, calendar, popover, skeleton, dropdown-menu, form, sonner, progress.
  *AC:* komponen ada di `src/components/ui` berekstensi `.jsx`.
- ☐ **T0.3** Install: prisma, @prisma/client, zod, react-hook-form, @hookform/resolvers, @tanstack/react-query, recharts, date-fns, bcryptjs, jose, lucide-react, vitest. Buat struktur folder Bagian 4 (file kosong boleh).
  *AC:* `npm run build` sukses.
- ☐ **T0.4** Buat `.env.example`, `src/lib/prisma.js` (singleton), `src/lib/utils.js` (`cn`, `toNumber`), `src/lib/format.js`, `src/lib/date.js` (`todayWIB` dll).
  *AC:* unit test Vitest untuk `formatRupiah` & `todayWIB` lulus.
- ☐ **T0.5** Buat `docs/DECISIONS.md` (kosong dengan judul) dan script `hash-password` di `scripts/hash-password.js`.
  *AC:* `npm run hash-password -- "abc123"` mencetak hash bcrypt.

### FASE 1 — Database & Auth
- ☐ **T1.1** Salin schema Bagian 5 ke `prisma/schema.prisma`, jalankan migrasi `init`.
  *AC:* semua tabel muncul di MySQL.
- ☐ **T1.2** `src/lib/api.js`: `ok()`, `fail()`, `AppError`, `withAuth(handler)`, `handleError()` (ZodError → 422, AppError → status-nya, lainnya → 500 tanpa membocorkan detail).
- ☐ **T1.3** `src/lib/auth.js` + schema Zod login + endpoint login/logout/me (kredensial dari `.env`).
  *AC:* login benar → cookie httpOnly terset, `/me` mengembalikan username; login salah → 401 pesan generik; `/api/accounts` tanpa cookie → 401.
- ☐ **T1.4** `middleware.js` + halaman `/login` (form RHF+Zod, error ditampilkan, redirect ke dashboard).
  *AC:* akses `/dashboard` tanpa login → redirect `/login`.
- ☐ **T1.5** Layout `(app)`: Sidebar, Topbar, BottomNav, tombol Keluar, QueryClientProvider, Toaster. Halaman placeholder untuk semua menu.
  *AC:* navigasi berfungsi di desktop & mobile (cek lebar 390px).
- ☐ **T1.6** `prisma/seed.js` sesuai 5.1 (idempotent + opsi `--demo`).
  *AC:* `npm run db:seed` dijalankan 2x tanpa error dan tanpa data ganda.

### FASE 2 — Master Data (Settings)
- ☐ **T2.1** Schemas Zod + `account.service.js` + API accounts (termasuk saldo saat ini).
- ☐ **T2.2** UI tab Dompet (list, tambah/edit dialog, nonaktifkan, hapus sesuai aturan).
- ☐ **T2.3** Schemas + `category.service.js` + API + UI tab Kategori (preset warna).
- ☐ **T2.4** Schemas + `contact.service.js` + API + UI tab Kontak.
- ☐ **T2.5** Komponen common: `MoneyInput`, `DatePicker`, `AmountText`, `StatCard`, `EmptyState`, `ConfirmDialog`, `ResponsiveDialog`, `PageHeader`, `StatusBadge`.
  *AC (T2.x):* CRUD berjalan, aturan 6.6 teruji manual (hapus dompet bertransaksi ditolak, kategori sistem terkunci), semua state loading/empty/error ada.

### FASE 3 — Transaksi
- ☐ **T3.1** Schema Zod transaksi + `transaction.service.js` (list+filter+summary, create, update, delete, validasi tipe kategori, blokir source DEBT_PAYMENT) + API.
  *AC:* unit test service untuk validasi tipe kategori & blokir edit DEBT_PAYMENT.
- ☐ **T3.2** Form tambah/edit transaksi (`ResponsiveDialog`) + tombol "+" global (topbar desktop, FAB mobile).
- ☐ **T3.3** Halaman Transaksi: filter bar, ringkasan, daftar dikelompokkan per tanggal, paginasi, edit/hapus, ikon gembok.
  *AC:* semua filter bekerja kombinasi; angka ringkasan sesuai filter.

### FASE 4 — Utang & Piutang (inti)
- ☐ **T4.1** Schema Zod debt (create dengan `installments[]`, refine: min 1, nominal > 0). `debt.service.js` bagian **create & list & detail** (renumber sequence, hitung `totalAmount`, hitung status turunan, `nextDue`).
  *AC:* unit test: total = jumlah cicilan; sequence terurut berdasar tanggal.
- ☐ **T4.2** API `GET/POST /api/debts`, `GET /api/debts/:id`.
- ☐ **T4.3** Halaman `/debts/new` lengkap dengan baris dinamis + generator "Bagi rata" + total otomatis.
  *AC:* bagi rata 5.000.000 ke 3 cicilan → 1.666.667 / 1.666.667 / 1.666.666; baris bisa diubah manual.
- ☐ **T4.4** Halaman daftar `/debts` (2 tab, filter, kartu, progress, badge).
- ☐ **T4.5** `debt.service.js` bagian **pembayaran**: `payInstallment`, `deletePayment` sesuai 6.4 (atomic). API payments.
  *AC:* unit test: bayar sebagian → PARTIAL; bayar sisa → PAID; semua PAID → debt PAID; kelebihan bayar ditolak; hapus pembayaran mengembalikan status dan menghapus transaksi.
- ☐ **T4.6** Halaman detail `/debts/[id]`: ringkasan, tabel cicilan, dialog Bayar/Terima, riwayat pembayaran + hapus.
  *AC:* setelah bayar, saldo dompet berubah dan transaksi muncul di halaman Transaksi dengan ikon gembok.
- ☐ **T4.7** Kelola cicilan: tambah/edit/hapus cicilan (aturan 6.3), edit info debt, batalkan, hapus (aturan 6.6). API terkait.
  *AC:* edit cicilan yang sudah ada pembayaran ditolak dengan pesan jelas.
- ☐ **T4.8** `GET /api/debts/upcoming` + badge di menu + komponen `UpcomingDueList`.

### FASE 5 — Dashboard & Laporan
- ☐ **T5.1** `dashboard.service.js` + API summary (gunakan agregasi `groupBy`/query terpisah, bukan loop N+1).
- ☐ **T5.2** UI Dashboard sesuai 8.5 (stat card, kartu utang/piutang, bar chart 6 bulan, donut kategori, jatuh tempo, transaksi terbaru, pemilih bulan).
- ☐ **T5.3** `report.service.js` + API cashflow & category.
- ☐ **T5.4** UI Laporan (2 tab, filter, toggle sertakan utang/piutang).
  *AC:* total di laporan = total di halaman Transaksi untuk filter yang sama.

### FASE 6 — Finishing
- ☐ **T6.1** Pass konsistensi UI: semua halaman punya skeleton/empty/error; teks Indonesia konsisten; cek mobile 390px & desktop 1280px.
- ☐ **T6.2** Cek keamanan: semua route (kecuali login) memakai `withAuth`, cookie httpOnly, `JWT_SECRET` & kredensial dari env, tidak ada `console.log` data sensitif, `.env` masuk `.gitignore`.
- ☐ **T6.3** `README.md`: cara setup (env, cara membuat hash password, migrasi, seed, run), cara backup database (`mysqldump`), cara deploy singkat.
  *AC akhir:* clone bersih → ikuti README → aplikasi berjalan dan bisa login.

---

## 11. Fase 2 (Setelah MVP Stabil — jangan dikerjakan sekarang)
1. Transfer antar dompet.
2. Anggaran (budget) per kategori + peringatan.
3. Transaksi berulang (gaji, langganan).
4. Notifikasi jatuh tempo (email / WhatsApp / push).
5. Ekspor CSV/Excel & impor CSV.
6. Opsi "Catat pencairan ke dompet" saat membuat utang/piutang (uang masuk/keluar saat pinjaman diterima/diberikan).
7. Dark mode, PWA (bisa di-install di HP).

---

## 12. Definition of Done (berlaku untuk SETIAP task)
- [ ] Sesuai Acceptance Criteria task.
- [ ] `npm run lint` bersih.
- [ ] Semua file berekstensi `.js` / `.jsx` (tidak ada TypeScript).
- [ ] Tidak ada query Prisma di file `route.js`.
- [ ] Route API (selain login) dibungkus `withAuth`.
- [ ] Input divalidasi Zod di server.
- [ ] UI punya state loading, empty, error.
- [ ] Teks UI berbahasa Indonesia, uang & tanggal terformat sesuai 8.3.
- [ ] Tidak ada library/fitur di luar dokumen ini.
- [ ] Commit sesuai format.

---

## 13. Daftar Larangan untuk Pelaksana
1. ❌ Jangan memakai TypeScript (`.ts`, `.tsx`, `tsconfig.json`, package `typescript`).
2. ❌ Jangan membuat fitur multi-user, register, atau kolom/tabel `User`/`userId`.
3. ❌ Jangan simpan uang sebagai `Float` di DB. Wajib `Decimal`.
4. ❌ Jangan simpan status "terlambat" di DB.
5. ❌ Jangan menulis logika bisnis di komponen React atau di `route.js`.
6. ❌ Jangan hardcode password/secret di kode. Selalu dari `.env`.
7. ❌ Jangan hapus transaksi hasil pembayaran utang lewat endpoint transaksi.
8. ❌ Jangan memakai `localStorage` untuk token. Pakai httpOnly cookie.
9. ❌ Jangan mengubah schema Prisma tanpa migrasi baru dan tanpa mencatat di `docs/DECISIONS.md`.
10. ❌ Jangan melewati task atau mengerjakan beberapa fase sekaligus.