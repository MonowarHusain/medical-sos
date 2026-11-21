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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const data = await getPendingCounts();
        if (isMounted) setCounts(data);
      } catch (e) {
        console.error("fetchCounts error:", e);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-white">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚑</span>
          <span className="font-bold text-lg text-white">Medical SOS</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Sidebar for Desktop & Collapsible for Mobile */}
      <aside
        className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col md:fixed md:h-full z-20 transition-all ${
          isMobileMenuOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚑</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Medical SOS</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Admin Command</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink
            href="/admin"
            icon="🚨"
            label="Emergency Dispatch"
            count={counts.sos}
            isUrgent={true}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/doctors"
            icon="👨‍⚕️"
            label="Doctors"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/patients"
            icon="🤒"
            label="Patients"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/appointments"
            icon="📅"
            label="Appointments"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/drivers"
            icon="🚑"
            label="Ambulance Fleet"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/pharmacy"
            icon="💊"
            label="Pharmacy Inventory"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <NavLink
            href="/admin/orders"
            icon="📦"
            label="Delivery Operations"
            count={counts.orders}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/admin/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 hover:bg-slate-800/80 p-2.5 rounded-xl transition group border border-transparent hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 border border-slate-700">
              👤
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Administrator</p>
              <p className="text-[11px] text-slate-400">View System Profile</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-950/40 text-red-400 hover:bg-red-950/70 hover:text-red-300 py-2.5 rounded-xl text-xs font-bold border border-red-900/50 transition-all"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  count,
  isUrgent,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  count?: number;
  isUrgent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition group relative"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      {count !== undefined && count > 0 && (
        <span
          className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black text-white ${
            isUrgent ? "bg-red-500 animate-pulse shadow-md shadow-red-500/50" : "bg-blue-600"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
