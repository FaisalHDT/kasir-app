"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

// Definisikan tipe data untuk kejelasan
interface Product { id: number; name: string; price: number; imageUrl: string; category: string; }
interface CartItem extends Product { qty: number; }
interface SaleHistory {
    id: number;
    total: number;
    createdAt: string;
    paymentMethod: string;
    saleItems: {
        quantity: number;
        product: {
            name: string;
        };
    }[];
}

// Komponen Ikon
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const CoffeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l-3-6.75h6l-3 6.75M4.5 6h15M7.5 6a4.5 4.5 0 119 0v8.25a3.75 3.75 0 01-3.75 3.75h-1.5A3.75 3.75 0 017.5 14.25V6z" /></svg>;
const JuiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" transform="rotate(90 12 12)" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M15.75 5.25a3 3 0 00-3-3" /></svg>;

export default function PosPage() {
  const { data: session } = useSession();
  
  const [activeView, setActiveView] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [historyData, setHistoryData] = useState<{ salesHistory: SaleHistory[], dailyTotal: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS'>('Cash');

  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Ambil data produk
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error("Gagal memuat produk");
        setProducts(await res.json());
      } catch (err) { console.error(err) } 
      finally { setIsLoading(false) }
    };
    fetchProducts();
  }, []);

  // Ambil data riwayat saat tab diubah
  useEffect(() => {
    if (activeView === 'history') {
      const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/sales/history');
          if (!res.ok) throw new Error('Gagal memuat riwayat penjualan');
          setHistoryData(await res.json());
        } catch (err) { setError(err instanceof Error ? err.message : 'Terjadi kesalahan') } 
        finally { setIsLoading(false) }
      };
      fetchHistory();
    }
  }, [activeView]);
  
  const categories = useMemo(() => ['Semua', ...new Set(products.map(p => p.category))], [products]);
  const filteredProducts = useMemo(() => activeCategory === 'Semua' ? products : products.filter(p => p.category === activeCategory), [products, activeCategory]);
  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (productId: number, newQty: number) => {
    setCart(prev => {
      if (newQty <= 0) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, qty: newQty } : item);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.015;
  const total = totalCartItems > 0 ? subtotal + tax : 0;

  const handlePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
        const res = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                total, tax, discount: 0, 
                saleItems: cart.map(item => ({ productId: item.id, qty: item.qty, price: item.price })),
                paymentMethod,
            }),
        });
        if (!res.ok) throw new Error(await res.text());
        
        setCart([]);
        setIsCartOpen(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading && !products.length && !historyData) {
    return <div className="flex h-full items-center justify-center">Memuat...</div>;
  }
  
  const PosView = () => (
    <>
      <div className="my-4 flex flex-shrink-0 flex-wrap gap-2">
        {categories.map(category => (
          <button key={category} onClick={() => setActiveCategory(category)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${ activeCategory === category ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-green-100'}`}>
            {category === 'Kopi' && <CoffeeIcon />}
            {category === 'Jus' && <JuiceIcon />}
            {category}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto pr-2 pb-20 md:pb-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map(product => (
            <div key={product.id} onClick={() => addToCart(product)} className="group cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="overflow-hidden rounded-md"><Image src={product.imageUrl || `https://placehold.co/300x300/png?text=${product.name}`} alt={product.name}  className="h-32 w-full object-cover transition-transform group-hover:scale-110" width={300} height={300}/></div>
              <div className="mt-3"><p className="truncate text-sm font-semibold text-gray-800">{product.name}</p><p className="mt-1 text-base font-bold text-green-600">Rp {product.price.toLocaleString('id-ID')}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const HistoryView = () => (
    <div className="mt-4 flex-grow overflow-y-auto pr-2">
      {isLoading && <p className="text-center">Memuat riwayat...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {historyData && (
        <>
          <div className="mb-4 rounded-lg bg-green-600 p-4 text-white shadow">
            <p className="text-sm">Total Penjualan Hari Ini</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(historyData.dailyTotal)}
            </p>
          </div>
          {historyData.salesHistory.length === 0 ? (
             <div className="py-10 text-center text-gray-500">Belum ada transaksi hari ini.</div>
          ) : (
            <div className="space-y-3">
              {historyData.salesHistory.map(sale => (
                <div key={sale.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex justify-between border-b pb-2 mb-2">
                    <div>
                      <p className="font-bold">Transaksi #{sale.id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                         - <span className={`font-semibold ${sale.paymentMethod === 'Cash' ? 'text-green-700' : 'text-blue-700'}`}>{sale.paymentMethod}</span>
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sale.total)}
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {sale.saleItems.map((item, index) => (
                      <li key={index} className="flex justify-between text-gray-600">
                        <span>{item.quantity}x {item.product.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-green-50 font-sans">
       {/* Notifikasi Sukses (Toast) */}
      <div className={`fixed top-5 right-5 z-[60] rounded-lg bg-green-600 px-6 py-4 text-white shadow-lg transition-transform duration-300 ${showSuccessToast ? 'translate-x-0' : 'translate-x-[120%]'}`}>
          Transaksi Berhasil Disimpan!
      </div>
      
      {/* Kolom Utama (kiri) */}
      <div className={`flex w-full flex-col p-4 transition-all duration-300 ${activeView === 'pos' ? 'md:w-3/5 lg:w-2/3' : 'md:w-full'}`}>
        <div className="flex-shrink-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Jus & Kopi Keliling</h1>
              <p className="text-gray-500">{currentDate}</p>
            </div>
            <div className="flex space-x-1 rounded-lg bg-green-200 p-1 self-start">
              <button onClick={() => setActiveView('pos')} className={`w-24 rounded-md px-3 py-1.5 text-sm font-medium ${activeView === 'pos' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-green-100'}`}>Kasir</button>
              <button onClick={() => setActiveView('history')} className={`w-24 rounded-md px-3 py-1.5 text-sm font-medium ${activeView === 'history' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-green-100'}`}>Riwayat</button>
            </div>
          </div>
        </div>

        {activeView === 'pos' ? <PosView/> : <HistoryView/>}
      </div>

      {/* --- Bagian Checkout --- */}
      {/* Overlay untuk mobile */}
      {isCartOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setIsCartOpen(false)}></div>}

      {/* Tombol Keranjang Mobile (FAB) */}
      {activeView === 'pos' && (
        <div className="fixed bottom-6 right-6 z-20 md:hidden">
          <button onClick={() => setIsCartOpen(true)} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700">
            <CartIcon />
            {totalCartItems > 0 && ( <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">{totalCartItems}</span>)}
          </button>
        </div>
      )}

      {/* Panel Checkout */}
      <div className={`
        fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-sm transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:h-auto md:max-w-none md:translate-x-0
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} 
        ${activeView === 'pos' ? 'md:w-2/5 lg:w-1/3' : 'md:hidden'}
      `}>
        <div className="flex h-full flex-col p-6">
            <div className="flex flex-shrink-0 items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
                <button onClick={() => setIsCartOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden"><CloseIcon/></button>
            </div>
             <div className="my-4 flex-grow overflow-y-auto pr-2">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <CartIcon/>
                  <p className="mt-4 font-semibold">Keranjang kosong</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cart.map(item => (
                    <li key={item.id} className="flex items-center gap-4 py-3">
                      <Image src={item.imageUrl} alt={item.name} width={300} height={300} className="h-14 w-14 rounded-lg object-cover" />
                      <div className="flex-grow">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="rounded-full p-1.5 transition bg-gray-100 hover:bg-red-100"><MinusIcon/></button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="rounded-full p-1.5 transition bg-gray-100 hover:bg-green-100"><PlusIcon/></button>
                      </div>
                       <button onClick={() => updateQty(item.id, 0)} className="text-gray-400 hover:text-red-500"><TrashIcon/></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex-shrink-0 space-y-4 border-t-2 border-dashed pt-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Pajak (1.5%)</span><span>Rp {tax.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-xl font-bold text-gray-800"><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
              </div>
              
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'QRIS')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                  <option>Cash</option>
                  <option>QRIS</option>
                </select>
              </div>

              <button onClick={handlePayment} disabled={isProcessing || cart.length === 0} className="w-full rounded-lg bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                {isProcessing ? 'Memproses...' : `Selesaikan Transaksi`}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

