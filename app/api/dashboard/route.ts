import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Akses Ditolak" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ message: "Parameter startDate dan endDate wajib diisi" }, { status: 400 });
    }

    // Perbaikan Timezone: Buat tanggal sebagai UTC untuk memastikan konsistensi
    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = new Date(`${endDateStr}T23:59:59.999Z`);

    const employees = await prisma.user.findMany({
      where: { role: 'pegawai' },
    });

    const reportData = await Promise.all(
      employees.map(async (employee) => {
        const sales = await prisma.sale.findMany({
          where: {
            userId: employee.id,
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            saleItems: {
              include: { product: { select: { name: true } } }
            }
          }
        });

        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const transactionCount = sales.length;
        const totalCash = sales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const totalQris = sales.filter(s => s.paymentMethod === 'QRIS').reduce((sum, s) => sum + s.total, 0);

        const productSales: { [key: string]: number } = {};
        sales.forEach(sale => {
          sale.saleItems.forEach(item => {
            productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
          });
        });

        const productsSold = Object.entries(productSales)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity);

        return {
          id: employee.id,
          name: employee.name || 'Tanpa Nama',
          totalSales,
          transactionCount,
          totalCash,
          totalQris,
          productsSold,
        };
      })
    );
    
    const allSalesInRange = await prisma.sale.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const grandTotalSales = allSalesInRange.reduce((sum, sale) => sum + sale.total, 0);
    const grandTotalCash = allSalesInRange.filter(s => s.paymentMethod === 'Cash').reduce((sum, sale) => sum + sale.total, 0);
    const grandTotalQris = allSalesInRange.filter(s => s.paymentMethod === 'QRIS').reduce((sum, sale) => sum + sale.total, 0);


    return NextResponse.json({
        employeeReport: reportData.sort((a, b) => b.totalSales - a.totalSales),
        summary: {
            grandTotalSales,
            grandTotalCash,
            grandTotalQris,
        }
    });

  } catch (error) {
    console.error("Error fetching dashboard report:", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

