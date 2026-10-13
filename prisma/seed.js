/**
 * prisma/seed.js — Idempotent seed data untuk DuitKu
 *
 * Penggunaan:
 *   npm run db:seed           → seed data default (dompet, kategori)
 *   node prisma/seed.js --demo → + data contoh (transaksi, utang, piutang)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isDemo = process.argv.includes("--demo");

async function main() {
  console.log("🌱 Seeding data default...");

  // ── Dompet Default ─────────────────────────────────
  await prisma.account.upsert({
    where: { name: "Tunai" },
    update: {},
    create: {
      name: "Tunai",
      type: "CASH",
      initialBalance: 0,
    },
  });
  console.log("  ✔ Dompet: Tunai");

  // ── Kategori INCOME ────────────────────────────────
  const incomeCategories = [
    { name: "Gaji", color: "#10b981" },
    { name: "Bonus", color: "#06b6d4" },
    { name: "Usaha", color: "#8b5cf6" },
    { name: "Lainnya", color: "#94a3b8" },
    { name: "Penerimaan Piutang", color: "#64748b", isSystem: true },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: "INCOME" } },
      update: {},
      create: {
        name: cat.name,
        type: "INCOME",
        color: cat.color,
        isSystem: cat.isSystem || false,
      },
    });
  }
  console.log("  ✔ Kategori INCOME:", incomeCategories.map((c) => c.name).join(", "));

  // ── Kategori EXPENSE ───────────────────────────────
  const expenseCategories = [
    { name: "Makan & Minum", color: "#f97316" },
    { name: "Transport", color: "#eab308" },
    { name: "Tagihan", color: "#ef4444" },
    { name: "Belanja", color: "#ec4899" },
    { name: "Kesehatan", color: "#14b8a6" },
    { name: "Hiburan", color: "#a855f7" },
    { name: "Pendidikan", color: "#3b82f6" },
    { name: "Lainnya", color: "#94a3b8" },
    { name: "Pembayaran Utang", color: "#64748b", isSystem: true },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: "EXPENSE" } },
      update: {},
      create: {
        name: cat.name,
        type: "EXPENSE",
        color: cat.color,
        isSystem: cat.isSystem || false,
      },
    });
  }
  console.log("  ✔ Kategori EXPENSE:", expenseCategories.map((c) => c.name).join(", "));

  // ── Data Demo ──────────────────────────────────────
  if (isDemo) {
    console.log("\n🎭 Seeding data demo...");

    // Dompet tambahan
    const bca = await prisma.account.upsert({
      where: { name: "BCA" },
      update: {},
      create: { name: "BCA", type: "BANK", initialBalance: 5000000 },
    });
    const gopay = await prisma.account.upsert({
      where: { name: "GoPay" },
      update: {},
      create: { name: "GoPay", type: "EWALLET", initialBalance: 100000 },
    });
    const tunai = await prisma.account.findUnique({ where: { name: "Tunai" } });
    console.log("  ✔ Dompet demo: BCA, GoPay");

    // Ambil kategori
    const catGaji = await prisma.category.findUnique({ where: { name_type: { name: "Gaji", type: "INCOME" } } });
    const catBonus = await prisma.category.findUnique({ where: { name_type: { name: "Bonus", type: "INCOME" } } });
    const catUsaha = await prisma.category.findUnique({ where: { name_type: { name: "Usaha", type: "INCOME" } } });
    const catMakan = await prisma.category.findUnique({ where: { name_type: { name: "Makan & Minum", type: "EXPENSE" } } });
    const catTransport = await prisma.category.findUnique({ where: { name_type: { name: "Transport", type: "EXPENSE" } } });
    const catTagihan = await prisma.category.findUnique({ where: { name_type: { name: "Tagihan", type: "EXPENSE" } } });
    const catBelanja = await prisma.category.findUnique({ where: { name_type: { name: "Belanja", type: "EXPENSE" } } });
    const catHiburan = await prisma.category.findUnique({ where: { name_type: { name: "Hiburan", type: "EXPENSE" } } });

    // Kontak demo
    const budi = await prisma.contact.upsert({
      where: { id: "contact-demo-budi" },
      update: {},
      create: { id: "contact-demo-budi", name: "Budi Santoso", phone: "081234567890", note: "Teman kantor" },
    });
    const sinta = await prisma.contact.upsert({
      where: { id: "contact-demo-sinta" },
      update: {},
      create: { id: "contact-demo-sinta", name: "Sinta Dewi", phone: "081298765432" },
    });
    console.log("  ✔ Kontak demo: Budi Santoso, Sinta Dewi");

    const now = new Date();

    // Cek apakah transaksi demo sudah ada
    const existingDemoTx = await prisma.transaction.findFirst({ where: { id: { startsWith: "tx-demo-" } } });
    if (!existingDemoTx) {
      const demoTransactions = [];

      // 20 transaksi di 3 bulan terakhir
      const txData = [
        { id: "tx-demo-01", accountId: bca.id, categoryId: catGaji.id, type: "INCOME", amount: 8000000, daysAgo: 1, note: "Gaji Oktober" },
        { id: "tx-demo-02", accountId: bca.id, categoryId: catBonus.id, type: "INCOME", amount: 2000000, daysAgo: 5, note: "Bonus kuartal" },
        { id: "tx-demo-03", accountId: tunai.id, categoryId: catMakan.id, type: "EXPENSE", amount: 35000, daysAgo: 0, note: "Makan siang" },
        { id: "tx-demo-04", accountId: tunai.id, categoryId: catMakan.id, type: "EXPENSE", amount: 50000, daysAgo: 1, note: "Makan malam" },
        { id: "tx-demo-05", accountId: gopay.id, categoryId: catTransport.id, type: "EXPENSE", amount: 25000, daysAgo: 2, note: "Gojek ke kantor" },
        { id: "tx-demo-06", accountId: bca.id, categoryId: catTagihan.id, type: "EXPENSE", amount: 350000, daysAgo: 3, note: "Listrik" },
        { id: "tx-demo-07", accountId: bca.id, categoryId: catTagihan.id, type: "EXPENSE", amount: 200000, daysAgo: 3, note: "Internet" },
        { id: "tx-demo-08", accountId: tunai.id, categoryId: catMakan.id, type: "EXPENSE", amount: 45000, daysAgo: 4, note: "Kopi dan snack" },
        { id: "tx-demo-09", accountId: gopay.id, categoryId: catBelanja.id, type: "EXPENSE", amount: 150000, daysAgo: 6, note: "Belanja Tokopedia" },
        { id: "tx-demo-10", accountId: bca.id, categoryId: catGaji.id, type: "INCOME", amount: 8000000, daysAgo: 31, note: "Gaji September" },
        { id: "tx-demo-11", accountId: tunai.id, categoryId: catMakan.id, type: "EXPENSE", amount: 40000, daysAgo: 32, note: "Makan siang" },
        { id: "tx-demo-12", accountId: gopay.id, categoryId: catTransport.id, type: "EXPENSE", amount: 30000, daysAgo: 33, note: "Grab ke mall" },
        { id: "tx-demo-13", accountId: bca.id, categoryId: catBelanja.id, type: "EXPENSE", amount: 500000, daysAgo: 35, note: "Baju baru" },
        { id: "tx-demo-14", accountId: tunai.id, categoryId: catHiburan.id, type: "EXPENSE", amount: 100000, daysAgo: 38, note: "Nonton bioskop" },
        { id: "tx-demo-15", accountId: bca.id, categoryId: catUsaha.id, type: "INCOME", amount: 1500000, daysAgo: 40, note: "Pendapatan freelance" },
        { id: "tx-demo-16", accountId: bca.id, categoryId: catGaji.id, type: "INCOME", amount: 8000000, daysAgo: 61, note: "Gaji Agustus" },
        { id: "tx-demo-17", accountId: tunai.id, categoryId: catMakan.id, type: "EXPENSE", amount: 55000, daysAgo: 62, note: "Makan keluarga" },
        { id: "tx-demo-18", accountId: bca.id, categoryId: catTagihan.id, type: "EXPENSE", amount: 340000, daysAgo: 63, note: "Listrik Agustus" },
        { id: "tx-demo-19", accountId: gopay.id, categoryId: catTransport.id, type: "EXPENSE", amount: 20000, daysAgo: 65, note: "Gojek" },
        { id: "tx-demo-20", accountId: bca.id, categoryId: catBelanja.id, type: "EXPENSE", amount: 250000, daysAgo: 70, note: "Groceries" },
      ];

      for (const tx of txData) {
        const txDate = new Date(now);
        txDate.setDate(txDate.getDate() - tx.daysAgo);
        txDate.setHours(0, 0, 0, 0);

        await prisma.transaction.create({
          data: {
            id: tx.id,
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            type: tx.type,
            amount: tx.amount,
            date: txDate,
            note: tx.note,
            source: "MANUAL",
          },
        });
      }
      console.log("  ✔ 20 transaksi demo");
    }

    // Cek apakah debt demo sudah ada
    const existingDemoDebt = await prisma.debt.findFirst({ where: { id: { startsWith: "debt-demo-" } } });
    if (!existingDemoDebt) {
      // Utang 1: Cicilan Motor (3 cicilan, tanggal & nominal berbeda)
      await prisma.debt.create({
        data: {
          id: "debt-demo-01",
          contactId: budi.id,
          type: "PAYABLE",
          title: "Cicilan Motor",
          principalAmount: 5500000,
          totalAmount: 6000000,
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          status: "ACTIVE",
          note: "Pinjaman beli motor bekas",
          installments: {
            create: [
              { id: "inst-demo-01", sequence: 1, dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15), amount: 1500000, paidAmount: 1500000, status: "PAID", paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 14) },
              { id: "inst-demo-02", sequence: 2, dueDate: new Date(now.getFullYear(), now.getMonth(), 5), amount: 2000000, paidAmount: 1000000, status: "PARTIAL" },
              { id: "inst-demo-03", sequence: 3, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 10), amount: 2500000, paidAmount: 0, status: "PENDING" },
            ],
          },
        },
      });

      // Utang 2: Pinjaman uang (1 cicilan)
      await prisma.debt.create({
        data: {
          id: "debt-demo-02",
          contactId: sinta.id,
          type: "PAYABLE",
          title: "Pinjaman modal usaha",
          principalAmount: 3000000,
          totalAmount: 3000000,
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          status: "ACTIVE",
          installments: {
            create: [
              { id: "inst-demo-04", sequence: 1, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), amount: 3000000, paidAmount: 0, status: "PENDING" },
            ],
          },
        },
      });

      // Piutang 1: sudah terlambat
      await prisma.debt.create({
        data: {
          id: "debt-demo-03",
          contactId: budi.id,
          type: "RECEIVABLE",
          title: "Pinjaman ke Budi",
          principalAmount: 1000000,
          totalAmount: 1000000,
          startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          status: "ACTIVE",
          installments: {
            create: [
              { id: "inst-demo-05", sequence: 1, dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), amount: 1000000, paidAmount: 0, status: "PENDING" },
            ],
          },
        },
      });

      // Piutang 2: masih aktif
      await prisma.debt.create({
        data: {
          id: "debt-demo-04",
          contactId: sinta.id,
          type: "RECEIVABLE",
          title: "Pinjaman ke Sinta",
          principalAmount: 750000,
          totalAmount: 750000,
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          status: "ACTIVE",
          installments: {
            create: [
              { id: "inst-demo-06", sequence: 1, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15), amount: 750000, paidAmount: 0, status: "PENDING" },
            ],
          },
        },
      });
      console.log("  ✔ 2 utang demo, 2 piutang demo");
    }
  }

  console.log("\n✅ Seed selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
