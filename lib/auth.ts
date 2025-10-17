import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        console.log("🔍 Login attempt:", email);

        if (!email || !password) {
          console.log("❌ Email atau password tidak diisi");
          throw new Error("Email dan password wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.log("❌ User tidak ditemukan:", email);
          throw new Error("Email atau password salah");
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatch) {
          console.log("❌ Password salah untuk:", credentials.email);
          throw new Error("Email atau password salah");
        }

        console.log("✅ Login sukses:", user.email);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});
