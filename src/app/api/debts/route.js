import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // PAYABLE (Utang) | RECEIVABLE (Piutang)
    const status = searchParams.get("status"); // ACTIVE | PAID | CANCELED
    const search = searchParams.get("search");

    const where = {};
    if (type) {
      // support legacy alias DEBT -> PAYABLE
      where.type = type === "DEBT" ? "PAYABLE" : type;
    }
    if (status) {
      where.status = status;
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { contact: { name: { contains: search.trim() } } },
        { note: { contains: search.trim() } },
      ];
    }

    const debts = await prisma.debt.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
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

    const serialized = debts.map((d) => {
      const totalAmount = Number(d.totalAmount);
      const paidAmount = d.installments.reduce((sum, inst) => sum + Number(inst.paidAmount), 0);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      // Collect all flat payments
      const payments = [];
      d.installments.forEach((inst) => {
        inst.payments.forEach((p) => {
          payments.push({
            id: p.id,
            installmentId: p.installmentId,
            amount: Number(p.amount),
            date: p.paidDate,
            note: p.note,
            account: p.account ? { ...p.account, initialBalance: Number(p.account.initialBalance) } : null,
          });
        });
      });

      return {
        id: d.id,
        contactId: d.contactId,
        personName: d.contact.name,
        contact: d.contact,
        type: d.type, // "PAYABLE" (Utang) | "RECEIVABLE" (Piutang)
        rawType: d.type,
        title: d.title,
        principalAmount: Number(d.principalAmount),
        totalAmount,
        amount: totalAmount,
        paidAmount,
        remainingAmount,
        startDate: d.startDate,
        dueDate: d.installments[0]?.dueDate || d.startDate,
        status: d.status,
        note: d.note,
        notes: d.note,
        installments: d.installments.map((inst) => ({
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
      };
    });

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error("GET /api/debts error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data utang & piutang" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type, // DEBT (PAYABLE) or RECEIVABLE
      personName,
      contactId,
      title,
      amount,
      totalAmount,
      principalAmount,
      dueDate,
      notes,
      note,
      installments,
    } = body;

    // Calculate total from installments if provided
    let calculatedTotal = 0;
    if (Array.isArray(installments) && installments.length > 0) {
      calculatedTotal = installments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }

    const numAmount = Number(principalAmount || totalAmount || amount || calculatedTotal || 0);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    const debtTitle = (title || personName || "Catatan Utang/Piutang").trim();
    const prismaType = type === "DEBT" || type === "PAYABLE" ? "PAYABLE" : "RECEIVABLE";

    // 1. Resolve contact (find by contactId, or find by name, or create new)
    let contact;
    if (contactId) {
      contact = await prisma.contact.findUnique({ where: { id: contactId } });
    }
    if (!contact && personName) {
      contact = await prisma.contact.findFirst({ where: { name: personName.trim() } });
      if (!contact) {
        contact = await prisma.contact.create({
          data: { name: personName.trim() },
        });
      }
    }
    if (!contact) {
      contact = await prisma.contact.create({
        data: { name: "Umum" },
      });
    }

    const createdDebt = await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.create({
        data: {
          contactId: contact.id,
          type: prismaType,
          title: debtTitle,
          principalAmount: numAmount,
          totalAmount: numAmount,
          startDate: new Date(),
          status: "ACTIVE",
          note: (note || notes || "").trim() || null,
        },
      });

      // Create installments
      if (Array.isArray(installments) && installments.length > 0) {
        for (let i = 0; i < installments.length; i++) {
          const inst = installments[i];
          await tx.debtInstallment.create({
            data: {
              debtId: debt.id,
              sequence: i + 1,
              dueDate: inst.dueDate ? new Date(inst.dueDate) : new Date(),
              amount: Number(inst.amount) || numAmount,
              paidAmount: 0,
              status: "PENDING",
            },
          });
        }
      } else {
        // Single default installment
        await tx.debtInstallment.create({
          data: {
            debtId: debt.id,
            sequence: 1,
            dueDate: dueDate ? new Date(dueDate) : new Date(),
            amount: numAmount,
            paidAmount: 0,
            status: "PENDING",
          },
        });
      }

      return await tx.debt.findUnique({
        where: { id: debt.id },
        include: {
          contact: true,
          installments: true,
        },
      });
    });

    return NextResponse.json({
      data: {
        ...createdDebt,
        amount: Number(createdDebt.totalAmount),
        totalAmount: Number(createdDebt.totalAmount),
        remainingAmount: Number(createdDebt.totalAmount),
        personName: createdDebt.contact.name,
      },
    });
  } catch (error) {
    console.error("POST /api/debts error:", error);
    return NextResponse.json(
      { error: "Gagal membuat catatan utang/piutang" },
      { status: 500 }
    );
  }
}
