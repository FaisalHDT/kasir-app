// lib/auth.ts
import NextAuth, { User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordMatch) return null;

        // Return user object yang sesuai dengan tipe yang kita definisikan
        return {
            id: user.id.toString(), // konversi id ke string
            email: user.email,
            name: user.name,
            role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Callback `jwt` dipanggil setiap kali token dibuat atau diperbarui
    async jwt({ token, user }) {
      if (user) {
        // Saat pertama kali login, tambahkan role ke token
        token.role = user.role;
        token.sub = user.id; // `sub` adalah ID pengguna standar di JWT
      }
      return token;
    },
    // Callback `session` dipanggil setiap kali sesi diakses
    async session({ session, token }) {
      if (session.user) {
        // Tambahkan properti dari token ke objek session.user
        session.user.role = token.role;
        session.user.id = token.sub as string; // Ambil id dari token
      }
      return session;
    },
  },
});