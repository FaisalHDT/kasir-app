import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // 1. Hash password untuk pengguna
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('adminpassword', saltRounds);
  const pegawaiPassword = await bcrypt.hash('pegawaipassword', saltRounds);

  // 2. Buat pengguna Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toko.com' },
    update: {},
    create: {
      email: 'admin@toko.com',
      name: 'Admin Utama',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log(`Pengguna admin dibuat: ${admin.email}`);

  // 3. Buat pengguna Pegawai
  const pegawai = await prisma.user.upsert({
    where: { email: 'pegawai@toko.com' },
    update: {},
    create: {
      email: 'pegawai@toko.com',
      name: 'Pegawai Satu',
      password: pegawaiPassword,
      role: 'pegawai',
    },
  });
  console.log(`Pengguna pegawai dibuat: ${pegawai.email}`);

  // 4. Buat data produk
  console.log('Membuat produk...');
  await prisma.product.createMany({
    data: [
      { name: 'Kopi Susu Gula Aren', price: 18000, category: 'Kopi', imageUrl: 'https://placehold.co/150x150/A37F5B/FFFFFF?text=Kopi+Susu' },
      { name: 'Americano', price: 15000, category: 'Kopi', imageUrl: 'https://placehold.co/150x150/4B3D3A/FFFFFF?text=Americano' },
      { name: 'Caffe Latte', price: 20000, category: 'Kopi', imageUrl: 'https://placehold.co/150x150/C8A989/FFFFFF?text=Latte' },
      { name: 'Jus Alpukat', price: 15000, category: 'Jus', imageUrl: 'https://placehold.co/150x150/5F8D4E/FFFFFF?text=Jus+Alpukat' },
      { name: 'Jus Mangga', price: 15000, category: 'Jus', imageUrl: 'https://placehold.co/150x150/FFC300/FFFFFF?text=Jus+Mangga' },
      { name: 'Jus Jambu', price: 12000, category: 'Jus', imageUrl: 'https://placehold.co/150x150/E75B6F/FFFFFF?text=Jus+Jambu' },
      { name: 'Teh Manis', price: 5000, category: 'Minuman Lain', imageUrl: 'https://placehold.co/150x150/F2C279/FFFFFF?text=Teh+Manis' },
      { name: 'Air Mineral', price: 4000, category: 'Minuman Lain', imageUrl: 'https://placehold.co/150x150/DDE6ED/FFFFFF?text=Air+Mineral' },
    ],
    skipDuplicates: true, // Lewati jika produk sudah ada
  });
  console.log('Produk berhasil dibuat.');

  console.log('Proses seeding selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Tutup koneksi Prisma
    await prisma.$disconnect();
  });
