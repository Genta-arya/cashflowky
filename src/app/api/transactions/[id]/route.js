import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
      },
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...tx,
        amount: Number(tx.amount),
        notes: tx.note,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, amount, date, accountId, categoryId, note, notes } = body;

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const newAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
    const newType = type || existing.type;
    const newAccId = accountId || existing.accountId;
    const txDate = date ? new Date(date) : existing.date;
    const finalNote = note !== undefined || notes !== undefined ? (note || notes || "").trim() || null : existing.note;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: newType,
        amount: newAmount,
        date: txDate,
        accountId: newAccId,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        note: finalNote,
      },
      include: {
        account: true,
        category: true,
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        amount: Number(updated.amount),
        notes: updated.note,
      },
    });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi" },
      { status: 500 }
    );
  }
}
