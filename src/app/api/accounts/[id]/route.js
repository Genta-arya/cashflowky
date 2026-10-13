import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, isActive } = body;

    const existing = await prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    const initBal = Number(updated.initialBalance);
    const netTx = updated.transactions.reduce((sum, tx) => {
      const amt = Number(tx.amount);
      return tx.type === "INCOME" ? sum + amt : sum - amt;
    }, 0);
    const currentBalance = initBal + netTx;

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        initialBalance: initBal,
        currentBalance: currentBalance,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("PUT /api/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui dompet" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing._count.transactions > 0 || existing._count.payments > 0) {
      return NextResponse.json(
        { error: "Dompet tidak dapat dihapus karena sudah memiliki riwayat transaksi atau pembayaran cicilan" },
        { status: 400 }
      );
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus dompet" },
      { status: 500 }
    );
  }
}
