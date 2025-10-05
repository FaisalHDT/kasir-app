import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Akses Ditolak" }, { status: 403 });
  }

  try {
    // Ambil semua pengguna dengan peran 'pegawai'
    const employees = await prisma.user.findMany({
      where: { role: 'pegawai' },
    });

    // Hitung statistik untuk setiap pegawai
    const employeeStats = await Promise.all(
      employees.map(async (employee) => {
        // 1. Hitung total nominal penjualan
        const totalSalesData = await prisma.sale.aggregate({
          _sum: { total: true },
          where: { userId: employee.id },
        });

        // 2. Hitung total unit produk terjual
        const totalItemsSoldData = await prisma.saleItem.aggregate({
          _sum: { quantity: true },
          where: { sale: { userId: employee.id } },
        });

        // 3. Cari produk terlaris per pegawai
        const topProductData = await prisma.saleItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          where: { sale: { userId: employee.id } },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 1,
        });
        
        let topProduct = null;
        if (topProductData.length > 0) {
          const product = await prisma.product.findUnique({
            where: { id: topProductData[0].productId },
          });
          if (product) {
            topProduct = {
              name: product.name,
              count: topProductData[0]._sum.quantity || 0,
            };
          }
        }

        return {
          id: employee.id,
          name: employee.name || 'Tanpa Nama',
          totalSales: totalSalesData._sum.total || 0,
          totalItemsSold: totalItemsSoldData._sum.quantity || 0,
          topProduct: topProduct || { name: '-', count: 0 },
        };
      })
    );
    
    // Urutkan pegawai berdasarkan total penjualan tertinggi
    const sortedEmployeeStats = employeeStats.sort((a, b) => b.totalSales - a.totalSales);

    return NextResponse.json(sortedEmployeeStats);

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

