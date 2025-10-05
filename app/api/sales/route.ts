import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth"; // Impor helper 'auth' yang sudah kita buat
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  // 1. Cek Autentikasi dengan Type Safety
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 2. Validasi Data Input
    const { total, tax, discount, saleItems } = body;
    if (!saleItems || !Array.isArray(saleItems) || saleItems.length === 0 || typeof total !== 'number') {
        return NextResponse.json({ message: 'Data permintaan tidak valid' }, { status: 400 });
    }
    
    const userId = parseInt(session.user.id);

    // 3. Buat Transaksi di Database
    const subtotal = saleItems.reduce(
      (acc: number, item: { qty: number; price: number }) => acc + item.qty * item.price,
      0
    );
    const newSale = await prisma.sale.create({
      data: {
        userId: userId,
        total: total,
        subtotal: subtotal,
        discount: discount || 0,
        tax: tax,
        saleItems: {
          // Perbaikan ada di sini: Gunakan `connect` untuk menghubungkan ke produk yang sudah ada
          create: saleItems.map((item: { productId: number; qty: number; price: number }) => ({
            quantity: item.qty,
            price: item.price,
            product: {
              connect: {
                id: item.productId,
              },
            },
          })),
        },
      },
      include: {
        saleItems: true,
      },
    });

    return NextResponse.json(newSale, { status: 201 }); // Status 201 berarti "Created"
  } catch (error) {
    console.error("Error saat membuat transaksi:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

