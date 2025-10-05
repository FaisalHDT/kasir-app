import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  // Jika sudah login, langsung arahkan ke halaman kasir
  if (session?.user) {
    redirect('/pos');
  }

  // Jika belum login, tampilkan halaman selamat datang sederhana
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Selamat Datang di Aplikasi Kasir</h1>
        <p className="mb-8 text-lg text-gray-600">Silakan login untuk memulai sesi Anda.</p>
        <Link 
          href="/login" 
          className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700"
        >
          Ke Halaman Login
        </Link>
      </div>
    </main>
  );
}