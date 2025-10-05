"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between bg-white px-6 py-3 shadow-md">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Aplikasi Kasir</h1>
      </div>
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            {session.user.role === 'admin' && (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-green-600">
                  Dashboard
                </Link>
                {/* Tambahkan Link Baru di Sini */}
                <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-green-600">
                  Manajemen Produk
                </Link>
              </>
            )}
            <Link href="/pos" className="text-sm font-medium text-gray-600 hover:text-green-600">
              Kasir
            </Link>
            <span className="text-sm font-medium text-gray-500">
              | Halo, <strong>{session.user.name}</strong>
            </span>
          </>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

