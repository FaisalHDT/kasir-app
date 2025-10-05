// app/(main)/layout.tsx
import Header from "@/components/Header"; // Impor komponen Header yang baru
import { AuthProvider } from "../providers";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}