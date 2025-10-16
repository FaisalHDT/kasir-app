"use server"; // Menandakan file ini hanya berjalan di server

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Tipe data untuk kejelasan
interface ExportTransaction {
  id: number;
  tanggal: string;
  waktu: string;
  pegawai: string | null;
  itemTerjual: string;
  metodePembayaran: string;
  total: number;
}

export async function exportTransactionsToExcel(
  startDateStr: string,
  endDateStr: string,
  employeeId: number
): Promise<{ error?: string; data?: ExportTransaction[] }> {
  // 1. Verifikasi Sesi di Server
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { error: "Akses Ditolak. Anda harus menjadi admin." };
  }

  try {
    // 2. Logika Pengambilan Data
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        userId: employeeId,
      },
      include: {
        user: { select: { name: true } },
        saleItems: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // 3. Format data sebelum dikirim kembali ke client
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      tanggal: new Date(sale.createdAt).toLocaleDateString('id-ID'),
      waktu: new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      pegawai: sale.user.name,
      itemTerjual: sale.saleItems.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
      metodePembayaran: sale.paymentMethod,
      total: sale.total,
    }));

    return { data: formattedSales };

  } catch (error) {
    console.error("Error in exportTransactionsToExcel:", error);
    return { error: "Terjadi kesalahan pada server saat mengambil data." };
  }
}

