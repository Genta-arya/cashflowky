import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { installmentId, amount, date, paidDate, accountId, note, notes } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal cicilan harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Dompet pembayaran wajib dipilih" },
        { status: 400 }
      );
    }

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        contact: true,
        installments: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: "Data utang/piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    if (debt.status === "PAID" || debt.status === "CANCELED") {
      return NextResponse.json(
        { error: `Tidak dapat membayar utang/piutang yang berstatus ${debt.status}` },
        { status: 400 }
      );
    }

    // Find installment to pay: by installmentId, or first unpaid installment
    let targetInst = null;
    if (installmentId) {
      targetInst = debt.installments.find((i) => i.id === installmentId);
    }
    if (!targetInst) {
      targetInst = debt.installments.find((i) => i.status !== "PAID");
    }

    if (!targetInst) {
      return NextResponse.json(
        { error: "Semua cicilan pada catatan ini sudah lunas" },
        { status: 400 }
      );
    }

    const currentInstRemaining = Number(targetInst.amount) - Number(targetInst.paidAmount);
    if (numAmount > currentInstRemaining) {
      return NextResponse.json(
        { error: `Nominal pembayaran (Rp ${numAmount.toLocaleString("id-ID")}) melebihi sisa cicilan ke-${targetInst.sequence} (Rp ${currentInstRemaining.toLocaleString("id-ID")})` },
        { status: 400 }
      );
    }

    const finalPayDate = date || paidDate ? new Date(date || paidDate) : new Date();
    const paymentNote = (note || notes || "").trim() || null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create financial transaction in ledger
      const isPayable = debt.type === "PAYABLE";
      let sysCat = null;

      if (isPayable) {
        sysCat = await tx.category.findFirst({
          where: { name: "Pembayaran Utang", type: "EXPENSE" },
        });
      } else {
        sysCat = await tx.category.findFirst({
          where: { name: "Penerimaan Piutang", type: "INCOME" },
        });
      }

      const txRecord = await tx.transaction.create({
        data: {
          accountId,
          categoryId: sysCat?.id || null,
          type: isPayable ? "EXPENSE" : "INCOME",
          amount: numAmount,
          date: finalPayDate,
          note: isPayable
            ? `Bayar cicilan ke-${targetInst.sequence}: ${debt.title}`
            : `Terima cicilan ke-${targetInst.sequence}: ${debt.title}`,
          source: "DEBT_PAYMENT",
        },
      });

      // 2. Create DebtPayment linked to transaction and installment
      const debtPayment = await tx.debtPayment.create({
        data: {
          installmentId: targetInst.id,
          accountId,
          transactionId: txRecord.id,
          amount: numAmount,
          paidDate: finalPayDate,
          note: paymentNote,
        },
      });

      // 3. Update installment paidAmount and status
      const newPaidAmount = Number(targetInst.paidAmount) + numAmount;
      const isFull = newPaidAmount >= Number(targetInst.amount);

      await tx.debtInstallment.update({
        where: { id: targetInst.id },
        data: {
          paidAmount: newPaidAmount,
          status: isFull ? "PAID" : "PARTIAL",
          paidAt: isFull ? finalPayDate : null,
        },
      });

      // 4. Check if all installments in debt are paid
      const allInsts = await tx.debtInstallment.findMany({
        where: { debtId: id },
      });
      const allPaid = allInsts.every((i) => i.id === targetInst.id ? isFull : i.status === "PAID");

      if (allPaid) {
        await tx.debt.update({
          where: { id },
          data: { status: "PAID" },
        });
      }

      return { debtPayment, transaction: txRecord };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("POST /api/debts/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran cicilan" },
      { status: 500 }
    );
  }
}
