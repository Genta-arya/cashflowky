import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // INCOME | EXPENSE

    const categories = await prisma.category.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serialized = categories.map((cat) => ({
      ...cat,
      hasTransactions: cat._count.transactions > 0,
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, type, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi" },
        { status: 400 }
      );
    }

    if (!type || !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Tipe kategori harus INCOME atau EXPENSE" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        color: color || "#64748b",
        isSystem: false,
      },
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}
