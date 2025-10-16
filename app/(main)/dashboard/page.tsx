"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { exportTransactionsToExcel } from "@/app/actions"; // 1. Impor Server Action

// Tipe data untuk laporan
interface ProductSold {
    name: string;
    quantity: number;
}
interface EmployeeReport {
    id: number;
    name: string;
    totalSales: number;
    transactionCount: number;
    totalCash: number;
    totalQris: number;
    productsSold: ProductSold[];
}
interface ReportSummary {
    grandTotalSales: number;
    grandTotalCash: number;
    grandTotalQris: number;
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Komponen Modal Detail
function DetailsModal({ isOpen, onClose, employee }: { isOpen: boolean, onClose: () => void, employee: EmployeeReport | null }) {
    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between border-b pb-3 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Detail Produk Terjual</h2>
                        <p className="text-sm text-gray-500">{employee.name}</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {employee.productsSold.length > 0 ? (
                    <ul className="space-y-2 text-sm max-h-80 overflow-y-auto pr-2">
                        {employee.productsSold.map((product, index) => (
                            <li key={index} className="flex justify-between rounded-md bg-gray-50 px-4 py-2">
                                <span className="text-gray-800">{product.name}</span>
                                <span className="font-semibold text-gray-900">{product.quantity} unit</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-10 text-center text-sm text-gray-400">Tidak ada produk terjual pada periode ini.</p>
                )}
            </div>
        </div>
    );
}

// Komponen Kartu Statistik
function StatCard({ title, value }: { title: string, value: string }) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-lg">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [reportData, setReportData] = useState<EmployeeReport[]>([]);
    const [summaryData, setSummaryData] = useState<ReportSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [exportingId, setExportingId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [endDate, setEndDate] = useState(formatDate(new Date()));
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeReport | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if(session?.user.role === 'admin') {
            const fetchReport = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
                    if (!res.ok) throw new Error("Gagal memuat laporan");
                    const data = await res.json();
                    setReportData(data.employeeReport || []);
                    setSummaryData(data.summary || null);
                } catch (err) { 
                    console.error(err); 
                    setReportData([]); 
                    setSummaryData(null); 
                } 
                finally { setIsLoading(false); }
            };
            fetchReport();
        }
    }, [session, startDate, endDate]);

    if (session && session.user.role !== 'admin') {
        router.push('/pos');
        return null;
    }
    
    const handleViewDetails = (employee: EmployeeReport) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    // 2. Perbarui fungsi handleExport untuk memanggil Server Action
    const handleExport = async (employee: EmployeeReport) => {
        setExportingId(employee.id);
        try {
            const result = await exportTransactionsToExcel(startDate, endDate, employee.id);
            
            if (result.error) throw new Error(result.error);
            if (!result.data || result.data.length === 0) {
                alert(`Tidak ada data transaksi untuk ${employee.name} pada periode ini.`);
                return;
            }

            const transactionDetails = result.data.map(tx => ({
                "ID": tx.id, "Tanggal": tx.tanggal, "Waktu": tx.waktu,
                "Item Terjual": tx.itemTerjual, "Metode Pembayaran": tx.metodePembayaran, "Total (Rp)": tx.total
            }));

            const worksheet = XLSX.utils.json_to_sheet(transactionDetails);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `Transaksi ${employee.name}`);

            XLSX.utils.sheet_add_aoa(worksheet, [
                [],
                ["", "", "", "", "TOTAL PENJUALAN", employee.totalSales],
                ["", "", "", "", "TOTAL TUNAI", employee.totalCash],
                ["", "", "", "", "TOTAL QRIS", employee.totalQris],
            ], { origin: -1 });

            const columnWidths = [ {wch: 5}, {wch: 12}, {wch: 10}, {wch: 50}, {wch: 20}, {wch: 15} ];
            worksheet["!cols"] = columnWidths;

            XLSX.writeFile(workbook, `Rincian_${employee.name}_${startDate}_hingga_${endDate}.xlsx`);

        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Terjadi kesalahan saat ekspor");
        } finally {
            setExportingId(null);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Laporan Penjualan</h1>
                            <p className="mt-1 text-gray-500">Pilih rentang tanggal untuk melihat laporan.</p>
                        </div>
                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"/>
                            <span className="text-gray-500 hidden sm:block">-</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"/>
                        </div>
                    </div>
                
                    {summaryData && !isLoading && (
                        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <StatCard title="Total Penjualan" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summaryData.grandTotalSales)} />
                            <StatCard title="Total Uang Tunai" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summaryData.grandTotalCash)} />
                            <StatCard title="Total Uang QRIS" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summaryData.grandTotalQris)} />
                        </div>
                    )}
                
                    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Peringkat</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama Pegawai</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Penjualan</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Tunai</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total QRIS</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Jml Transaksi</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Memuat laporan...</td></tr>
                                    ) : reportData.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Tidak ada data penjualan pada periode ini.</td></tr>
                                    ) : (
                                        reportData.map((employee, index) => (
                                            <tr key={employee.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600'}`}>{index + 1}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{employee.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(employee.totalSales)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(employee.totalCash)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(employee.totalQris)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-800">{employee.transactionCount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
                                                    <button onClick={() => handleViewDetails(employee)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Detail</button>
                                                    <button onClick={() => handleExport(employee)} disabled={exportingId === employee.id} className="text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400">
                                                        {exportingId === employee.id ? 'Loading...' : 'Export'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} employee={selectedEmployee} />
        </>
    );
}

