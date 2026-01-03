"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getPendingCounts } from "../actions";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [counts, setCounts] = useState({ sos: 0, orders: 0 });

    useEffect(() => {
        const fetchCounts = async () => {
            const data = await getPendingCounts();
            setCounts(data);
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Medical SOS
                    </h1>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink href="/admin" icon="🚨" label="Emergency Dispatch" count={counts.sos} isUrgent={true} />
                    <NavLink href="/admin/doctors" icon="👨‍⚕️" label="Doctors" />
                    <NavLink href="/admin/patients" icon="🤒" label="Patients" />
                    <NavLink href="/admin/appointments" icon="📅" label="Appointments" />
                    <NavLink href="/admin/drivers" icon="🚑" label="Ambulance Drivers" />
                    <NavLink href="/admin/pharmacy" icon="💊" label="Pharmacy" />
                    <NavLink href="/admin/orders" icon="📦" label="Delivery" count={counts.orders} />
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <Link href="/admin/profile" className="flex items-center gap-3 mb-3 hover:bg-slate-700 p-2 rounded transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-600">
                            👤
                        </div>
                        <div>
                            <p className="text-sm font-medium">Administrator</p>
                            <p className="text-xs text-slate-500">View Profile</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => {
                            // Clear any potential auth state
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        <span>🚪</span> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label, count, isUrgent }: { href: string; icon: string; label: string; count?: number; isUrgent?: boolean }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors relative"
        >
            <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{label}</span>
            </div>

            {count && count > 0 && (
                <span className={`
                    absolute right-2 top-1/2 -translate-y-1/2 
                    flex items-center justify-center 
                    min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white
                    ${isUrgent ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-blue-500'}
                `}>
                    {count}
                </span>
            )}
        </Link>
    );
}
