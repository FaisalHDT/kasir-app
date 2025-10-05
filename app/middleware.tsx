import { auth } from "@/lib/auth";
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const userRole = session?.user?.role;

  const isLoggedIn = !!session;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = nextUrl.pathname === '/login';
  const isHomePage = nextUrl.pathname === '/';

  // Izinkan rute API Auth untuk proses login/logout
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Jika belum login dan mencoba akses halaman yang dilindungi
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Logika setelah pengguna berhasil login
  if (isLoggedIn) {
    // Jika sudah login tapi mencoba akses halaman login atau halaman utama,
    // alihkan langsung ke halaman default mereka.
    if (isPublicRoute || isHomePage) {
      const redirectUrl = userRole === 'admin' ? '/dashboard' : '/pos';
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    // Jika pegawai mencoba akses dashboard, alihkan ke POS
    if (nextUrl.pathname.startsWith('/dashboard') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/pos', nextUrl));
    }
  }

  return NextResponse.next();
});

// Konfigurasi path matcher yang lebih fleksibel
// Ini akan menjalankan middleware di semua path kecuali yang secara eksplisit dikecualikan (aset statis)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

