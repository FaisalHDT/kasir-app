"use client";

import { SessionProvider } from "next-auth/react";

// Pastikan ini adalah NAMED EXPORT (menggunakan 'export function')
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
