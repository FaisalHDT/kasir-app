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

// Komponen Modal generik yang bisa kita gunakan kembali
function Modal({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    // Latar belakang gelap (overlay)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Konten Modal */}
      <div 
        className="w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl transition-all duration-300"
        onClick={e => e.stopPropagation()} // Mencegah modal tertutup saat diklik di dalamnya
      >
        {children}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State untuk modal dan form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fungsi untuk mengambil daftar produk dari API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("Gagal memuat produk");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Middleware sudah menangani ini, tapi sebagai pengaman tambahan di sisi klien
  if (session && session.user.role !== 'admin') {
      router.push('/pos');
      return null;
  }
  
  // Fungsi untuk membuka modal tambah
  const handleAdd = () => {
    setSelectedProduct(null); // Pastikan tidak ada produk terpilih
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };
  
  // Fungsi untuk membuka modal edit
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  // Fungsi untuk menangani submit form (baik tambah maupun edit)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products';
    const method = selectedProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan produk');
      }
      
      setSuccess(`Produk berhasil ${selectedProduct ? 'diperbarui' : 'ditambahkan'}!`);
      await fetchProducts(); // Muat ulang daftar produk
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 1500); // Tutup modal setelah 1.5 detik

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fungsi untuk membuka modal konfirmasi hapus
  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };
  
  // Fungsi untuk mengeksekusi penghapusan
  const confirmDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
        const res = await fetch(`/api/products/${selectedProduct.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Gagal menghapus produk");

        await fetchProducts();
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manajemen Produk</h1>
                <p className="mt-1 text-sm text-gray-500">Tambah, edit, atau hapus produk dari daftar.</p>
            </div>
            <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Tambah Produk
            </button>
        </div>

        {/* Tabel Daftar Produk */}
        <div className="rounded-xl bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Harga</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Memuat daftar produk...</td></tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-11 w-11 flex-shrink-0"><img className="h-11 w-11 rounded-full object-cover" src={product.imageUrl} alt={product.name} /></div>
                          <div className="ml-4"><div className="text-sm font-medium text-gray-900">{product.name}</div></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">{product.category}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Rp {product.price.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => handleDelete(product)} className="ml-4 text-red-600 hover:text-red-900">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal untuk Tambah/Edit Produk */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="mb-6 text-xl font-bold text-gray-900">{selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-100 p-3 text-center text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-md bg-green-100 p-3 text-center text-sm text-green-700">{success}</div>}
            
            <input type="text" name="name" defaultValue={selectedProduct?.name} placeholder="Nama Produk" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"/>
            <input type="number" name="price" defaultValue={selectedProduct?.price} placeholder="Harga" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"/>
            <select name="category" defaultValue={selectedProduct?.category || 'Kopi'} className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                <option>Kopi</option>
                <option>Jus</option>
                <option>Lainnya</option>
            </select>
            <input type="text" name="imageUrl" defaultValue={selectedProduct?.imageUrl} placeholder="URL Gambar (Opsional)" className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"/>
            
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-300">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
      </Modal>

      {/* Modal untuk Konfirmasi Hapus */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Konfirmasi Hapus</h2>
        <p className="text-sm text-gray-600">Anda yakin ingin menghapus produk <strong>{selectedProduct?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 pt-6">
            <button onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-300">Batal</button>
            <button onClick={confirmDelete} disabled={isSubmitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
        </div>
      </Modal>
    </div>
  );
}

    

