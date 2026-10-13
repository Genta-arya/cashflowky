import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    });

    // Calculate live current balance from initialBalance + sum(income) - sum(expense)
    const serialized = accounts.map((acc) => {
      const initBal = Number(acc.initialBalance);
      const netTx = acc.transactions.reduce((sum, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "INCOME" ? sum + amt : sum - amt;
      }, 0);
      const currentBalance = initBal + netTx;

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        initialBalance: initBal,
        currentBalance: currentBalance,
        isActive: acc.isActive,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        hasTransactions: acc._count.transactions > 0 || acc._count.payments > 0,
      };
    });

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dompet" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, type, initialBalance, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama dompet wajib diisi" },
        { status: 400 }
      );
    }

    const initBal = Number(initialBalance) || 0;

    const account = await prisma.account.create({
      data: {
        name: name.trim(),
        type: type || "CASH",
        initialBalance: initBal,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      data: {
        ...account,
        initialBalance: Number(account.initialBalance),
        currentBalance: Number(account.initialBalance),
      },
    });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return NextResponse.json(
      { error: "Gagal membuat dompet baru" },
      { status: 500 }
    );
  }
}
