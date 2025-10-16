import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { total, tax, discount, saleItems, paymentMethod } = body; // Ambil paymentMethod dari body

    if (!saleItems || !Array.isArray(saleItems) || saleItems.length === 0 || typeof total !== 'number' || !paymentMethod) {
        return NextResponse.json({ message: 'Data permintaan tidak valid' }, { status: 400 });
    }
    
    const userId = parseInt(session.user.id);

    // Calculate subtotal as sum of (quantity * price) for all sale items
    const subtotal = saleItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const newSale = await prisma.sale.create({
      data: {
        userId: userId,
        subtotal: subtotal,
        total: total,
        discount: discount || 0,
        tax: tax || 0,
        paymentMethod: paymentMethod, // Simpan paymentMethod ke database
        saleItems: {
          create: saleItems.map((item: { productId: number; qty: number; price: number }) => ({
            quantity: item.qty,
            price: item.price,
            product: {
              connect: { id: item.productId },
            },
          })),
        },
      },
      include: {
        saleItems: true,
      },
    });

    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error("Error saat membuat transaksi:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
