"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Kopi');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ambil data produk
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Redirect jika bukan admin
  if (session && session.user.role !== 'admin') {
      router.push('/pos');
      return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, category, imageUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menambah produk');
      }

      setSuccess(`Produk "${name}" berhasil ditambahkan!`);
      // Reset form
      setName('');
      setPrice('');
      setCategory('Kopi');
      setImageUrl('');
      // Muat ulang daftar produk
      await fetchProducts();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">Manajemen Produk</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Kolom Kiri: Form Tambah Produk */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Tambah Produk Baru</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>}
                {success && <div className="rounded-md bg-green-100 p-3 text-sm text-green-700">{success}</div>}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Produk</label>
                  <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga</label>
                  <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <option>Kopi</option>
                    <option>Jus</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL Gambar (Opsional)</label>
                  <input type="text" id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-green-600 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                  {isSubmitting ? 'Menyimpan...' : 'Tambah Produk'}
                </button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Daftar Produk */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Daftar Produk Saat Ini</h2>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {isLoading ? (
                      <tr><td colSpan={3} className="px-6 py-4 text-center">Memuat...</td></tr>
                    ) : (
                      products.map(product => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl} alt={product.name} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">{product.category}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">Rp {product.price.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

