import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : startOfMonth;
    const endDate = endDateParam ? new Date(endDateParam) : endOfMonth;
    if (endDateParam) endDate.setHours(23, 59, 59, 999);

    // 1. All accounts with balances (initial + transactions)
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    const serializedAccounts = accounts.map((acc) => {
      const initBal = Number(acc.initialBalance);
      const netTx = acc.transactions.reduce((sum, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "INCOME" ? sum + amt : sum - amt;
      }, 0);
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        initialBalance: initBal,
        currentBalance: initBal + netTx,
        isActive: acc.isActive,
      };
    });

    const totalBalance = serializedAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

    // 2. Transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "asc" },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenseMap = {};
    const categoryIncomeMap = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "INCOME") {
        totalIncome += amt;
        const catName = tx.category?.name || "Lainnya";
        categoryIncomeMap[catName] = (categoryIncomeMap[catName] || 0) + amt;
      } else if (tx.type === "EXPENSE") {
        totalExpense += amt;
        const catName = tx.category?.name || "Lainnya";
        categoryExpenseMap[catName] = (categoryExpenseMap[catName] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpense;

    // 3. Active debts and receivables from schema (status: ACTIVE)
    const activeDebts = await prisma.debt.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        installments: true,
      },
    });

    let totalActiveDebt = 0;
    let totalActiveReceivable = 0;

    activeDebts.forEach((d) => {
      const totalAmount = Number(d.totalAmount);
      const paidAmount = d.installments.reduce((sum, inst) => sum + Number(inst.paidAmount), 0);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      if (d.type === "PAYABLE") {
        totalActiveDebt += remainingAmount;
      } else if (d.type === "RECEIVABLE") {
        totalActiveReceivable += remainingAmount;
      }
    });

    // Format category breakdown
    const expenseBreakdown = Object.entries(categoryExpenseMap).map(([name, total]) => ({
      name,
      total,
      percentage: totalExpense > 0 ? ((total / totalExpense) * 100).toFixed(1) : "0",
    })).sort((a, b) => b.total - a.total);

    const incomeBreakdown = Object.entries(categoryIncomeMap).map(([name, total]) => ({
      name,
      total,
      percentage: totalIncome > 0 ? ((total / totalIncome) * 100).toFixed(1) : "0",
    })).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      data: {
        period: {
          startDate,
          endDate,
        },
        summary: {
          totalBalance,
          totalIncome,
          totalExpense,
          netSavings,
          totalActiveDebt,
          totalActiveReceivable,
        },
        accounts: serializedAccounts,
        expenseBreakdown,
        incomeBreakdown,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("GET /api/reports/summary error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ringkasan laporan" },
      { status: 500 }
    );
  }
}
