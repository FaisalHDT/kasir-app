"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesData {
    name: string;
    totalSales: number;
}

export default function SalesChart({ data }: { data: SalesData[] }) {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                        tickFormatter={(value) => 
                            new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR',
                                notation: 'compact' 
                            }).format(value as number)
                        } 
                    />
                    <Tooltip 
                        formatter={(value) => 
                            new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR' 
                            }).format(value as number)
                        } 
                    />
                    <Legend />
                    <Bar dataKey="totalSales" fill="#22c55e" name="Total Penjualan" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
