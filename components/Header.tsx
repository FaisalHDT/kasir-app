"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

// Komponen Ikon Hamburger
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-white px-4 sm:px-6 py-3 shadow-md z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Judul Aplikasi */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kasir Kopi & Jus</h1>
        </div>

        {/* Menu Desktop (Terlihat di layar medium ke atas) */}
        <nav className="hidden items-center gap-4 md:flex">
          {session?.user && (
            <>
              {session.user.role === 'admin' && (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">
                    Laporan
                  </Link>
                  <Link href="/products" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">
                    Produk
                  </Link>
                </>
              )}
              <Link href="/pos" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">
                Kasir
              </Link>
              <span className="text-sm font-medium text-gray-500">
                | Halo, <strong>{session.user.name}</strong>
              </span>
            </>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
          >
            Logout
          </button>
        </nav>

        {/* Tombol Hamburger (Hanya terlihat di mobile) */}
        <div className="md:hidden">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            >
                <HamburgerIcon />
            </button>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {isMenuOpen && (
        <div className="absolute left-0 mt-3 w-full rounded-b-lg bg-white shadow-lg md:hidden">
            <nav className="flex flex-col space-y-2 p-4">
                {session?.user && (
                    <div className="mb-2 border-b pb-2">
                        <p className="text-sm font-medium text-gray-800">Halo, <strong>{session.user.name}</strong></p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                )}

                {session?.user.role === 'admin' && (
                    <>
                        <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">Laporan</Link>
                        <Link href="/products" onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">Manajemen Produk</Link>
                    </>
                )}
                <Link href="/pos" onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">Kasir</Link>
                
                <div className="border-t pt-2">
                    <button
                        onClick={() => {
                            setIsMenuOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                        className="w-full rounded-md bg-red-500 px-3 py-2 text-left font-bold text-white transition-colors hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </nav>
        </div>
      )}
    </header>
  );
}

