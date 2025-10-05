import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Fungsi GET yang sudah ada (untuk mengambil semua produk)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

// Fungsi POST baru untuk menambah produk
export async function POST(req: Request) {
    const session = await auth();

    // Proteksi: Hanya admin yang bisa menambah produk
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Akses Ditolak" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, price, category, imageUrl } = body;

        // Validasi input sederhana
        if (!name || !price || !category) {
            return NextResponse.json({ message: "Nama, harga, dan kategori wajib diisi" }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price), // Pastikan harga adalah angka
                category,
                imageUrl: imageUrl || `https://placehold.co/300x300?text=${name}`, // URL placeholder jika kosong
            },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
    }
}

