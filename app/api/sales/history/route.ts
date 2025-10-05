import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);

    // Tentukan awal dan akhir hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Awal hari (00:00:00)

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Awal hari berikutnya

    // 1. Ambil riwayat penjualan untuk pengguna ini, hari ini
    const salesHistory = await prisma.sale.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: today, // gte: greater than or equal to
          lt: tomorrow, // lt: less than
        },
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: { name: true }, // Ambil nama produk
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Tampilkan yang terbaru di atas
      },
    });

    // 2. Hitung total penjualan hari ini
    const dailyTotalAggregation = await prisma.sale.aggregate({
        _sum: { total: true },
        where: {
            userId: userId,
            createdAt: {
                gte: today,
                lt: tomorrow,
            }
        }
    });

    return NextResponse.json({
        salesHistory,
        dailyTotal: dailyTotalAggregation._sum.total || 0,
    });

  } catch (error) {
    console.error("Error fetching sales history:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
