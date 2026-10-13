import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        contact: true,
        installments: {
          orderBy: { sequence: "asc" },
          include: {
            payments: {
              include: { account: true },
            },
          },
        },
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: "Data utang/piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    const totalAmount = Number(debt.totalAmount);
    const paidAmount = debt.installments.reduce((sum, inst) => sum + Number(inst.paidAmount), 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const payments = [];
    debt.installments.forEach((inst) => {
      inst.payments.forEach((p) => {
        payments.push({
          id: p.id,
          installmentId: p.installmentId,
          amount: Number(p.amount),
          date: p.paidDate,
          paidDate: p.paidDate,
          note: p.note,
          account: p.account ? { ...p.account, initialBalance: Number(p.account.initialBalance) } : null,
        });
      });
    });

    return NextResponse.json({
      data: {
        id: debt.id,
        contactId: debt.contactId,
        personName: debt.contact.name,
        contact: debt.contact,
        type: debt.type === "PAYABLE" ? "PAYABLE" : "RECEIVABLE",
        title: debt.title,
        principalAmount: Number(debt.principalAmount),
        totalAmount,
        amount: totalAmount,
        paidAmount,
        remainingAmount,
        startDate: debt.startDate,
        dueDate: debt.installments[0]?.dueDate || debt.startDate,
        status: debt.status,
        note: debt.note,
        notes: debt.note,
        installments: debt.installments.map((inst) => ({
          id: inst.id,
          sequence: inst.sequence,
          installmentNumber: inst.sequence,
          dueDate: inst.dueDate,
          amount: Number(inst.amount),
          paidAmount: Number(inst.paidAmount),
          status: inst.status,
          paidAt: inst.paidAt,
          note: inst.note,
        })),
        payments,
      },
    });
  } catch (error) {
    console.error("GET /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data utang/piutang" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, note, notes, status } = body;

    const existing = await prisma.debt.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data utang/piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.debt.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(note !== undefined || notes !== undefined ? { note: (note || notes || "").trim() || null } : {}),
        ...(status && { status }),
      },
      include: {
        contact: true,
        installments: true,
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        amount: Number(updated.totalAmount),
        totalAmount: Number(updated.totalAmount),
      },
    });
  } catch (error) {
    console.error("PUT /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui utang/piutang" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await prisma.debt.findUnique({
      where: { id },
      include: {
        installments: {
          include: { payments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data utang/piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if any payment exists
    const hasPayments = existing.installments.some((inst) => inst.payments.length > 0);
    if (hasPayments) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus utang/piutang yang sudah memiliki riwayat pembayaran. Silakan ubah status menjadi Dibatalkan." },
        { status: 400 }
      );
    }

    // Delete debt and its cascade installments
    await prisma.debt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus utang/piutang" },
      { status: 500 }
    );
  }
}
