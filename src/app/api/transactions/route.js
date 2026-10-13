import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // INCOME | EXPENSE
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search && search.trim()) {
      where.note = {
        contains: search.trim(),
      };
    }

    const [total, transactions] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          account: true,
          category: true,
        },
      }),
    ]);

    const serialized = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      notes: t.note, // compatibility alias
      account: t.account
        ? {
            ...t.account,
            initialBalance: Number(t.account.initialBalance),
          }
        : null,
    }));

    return NextResponse.json({
      data: serialized,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, amount, date, accountId, categoryId, note, notes } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal transaksi harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    if (!type || !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Tipe transaksi harus INCOME atau EXPENSE" },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Dompet wajib dipilih" },
        { status: 400 }
      );
    }

    const txDate = date ? new Date(date) : new Date();
    const finalNote = (note || notes || "").trim() || null;

    const createdTx = await prisma.transaction.create({
      data: {
        type,
        amount: numAmount,
        date: txDate,
        accountId,
        categoryId: categoryId || null,
        note: finalNote,
        source: "MANUAL",
      },
      include: {
        account: true,
        category: true,
      },
    });

    return NextResponse.json({
      data: {
        ...createdTx,
        amount: Number(createdTx.amount),
        notes: createdTx.note,
      },
    });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi" },
      { status: 500 }
    );
  }
}
