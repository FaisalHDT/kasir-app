// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Perluas tipe User bawaan
declare module "next-auth" {
  interface User {
    id: string; // Pastikan id adalah string, karena NextAuth sering menanganinya sebagai string
    role: string;
  }
  
  // Perluas tipe Session untuk menyertakan properti kustom
  interface Session {
    user: User & DefaultSession["user"]; // Gabungkan tipe kustom dengan tipe default
  }
}

// Perluas tipe JWT (JSON Web Token)
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
  }
}