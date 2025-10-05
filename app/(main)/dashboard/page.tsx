import { auth } from "../../../lib/auth";
import { redirect } from "next/navigation";
import prisma from "../../../lib/prisma"; // Langsung akses prisma
import SalesChart from "@/components/dashboard/SalesChart";

// Komponen Kartu Statistik (tetap sama)
function StatCard({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description: string }) {
    return (
        <div className="transform rounded-xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-start justify-between">
                <div className="flex-grow">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
                    <p className="mt-1 text-xs text-gray-400">{description}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 text-green-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Ikon untuk Kartu Statistik (tetap sama)
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 6v1m0-1c-1.11 0-2.08.402-2.599 1M12 18c-1.11 0-2.08-.402-2.599-1M12 4a8 8 0 100 16 8 8 0 000-16z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

// Fungsi untuk mengambil data dashboard
async function getDashboardData() {
    try {
        const salesAggregation = await prisma.sale.aggregate({ _sum: { total: true } });
        const employeeCount = await prisma.user.count({ where: { role: 'pegawai' } });
        const topProductData = await prisma.product.findFirst({
            orderBy: { saleItems: { _count: "desc" } },
            include: { _count: { select: { saleItems: true } } },
        });
        const salesByUser = await prisma.user.findMany({
            where: { role: 'pegawai' },
            include: {
                _count: { select: { sales: true } },
                sales: { select: { total: true } }
            }
        });

        const salesPerEmployee = salesByUser.map(user => ({
            name: user.name || 'Tanpa Nama',
            totalSales: user.sales.reduce((acc, sale) => acc + sale.total, 0),
            transactionCount: user._count.sales
        })).sort((a, b) => b.totalSales - a.totalSales);

        return {
            totalSales: salesAggregation._sum.total || 0,
            employeeCount,
            topProduct: {
                name: topProductData?.name || '-',
                count: topProductData?._count.saleItems || 0,
            },
            salesPerEmployee,
        };
    } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        return null;
    }
}


export default async function DashboardPage() {
    // 1. Verifikasi sesi sekali di awal
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
        redirect('/login');
    }
    
    // 2. Panggil fungsi untuk mengambil data langsung dari database
    const data = await getDashboardData();

    if (!data) {
        return <div className="p-8 text-center text-red-500">Gagal memuat data dashboard.</div>
    }

    const { totalSales, employeeCount, topProduct, salesPerEmployee } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">Dashboard Analitik</h1>

                {/* Grid Statistik Utama */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard 
                        icon={<DollarIcon/>}
                        title="Total Pendapatan" 
                        value={`Rp ${new Intl.NumberFormat('id-ID').format(totalSales)}`} 
                        description="Dari seluruh penjualan"
                    />
                     <StatCard 
                        icon={<UsersIcon/>}
                        title="Jumlah Karyawan" 
                        value={employeeCount.toString()}
                        description="Pegawai aktif saat ini"
                    />
                    <StatCard 
                        icon={<StarIcon/>}
                        title="Produk Terlaris" 
                        value={topProduct.name}
                        description={`${topProduct.count} unit terjual`}
                    />
                </div>

                {/* Analisis Karyawan */}
                <div className="rounded-xl bg-white p-6 shadow-lg">
                     <h2 className="mb-4 text-xl font-bold text-gray-800">Performa Penjualan Karyawan</h2>
                     <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                             <SalesChart data={salesPerEmployee} />
                        </div>
                        <div className="lg:col-span-1">
                            <ul className="h-full divide-y divide-gray-200">
                                {salesPerEmployee.map((employee: any, index: number) => (
                                    <li key={index} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-semibold text-gray-800">{employee.name}</p>
                                            <p className="text-sm text-gray-500">{employee.transactionCount} transaksi</p>
                                        </div>
                                        <p className="font-bold text-green-600">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(employee.totalSales)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

