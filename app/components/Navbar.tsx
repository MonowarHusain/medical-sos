"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load user from local storage
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  if (!user) return null; // Don't show navbar if not logged in

  // Determine home link based on role
  const homeLink = user.role === "ADMIN" ? "/admin" 
                 : user.role === "DOCTOR" ? "/appointments" 
                 : "/";

  return (
    <nav className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center text-white mb-6 shadow-md">
      {/* LEFT: Logo / Home Link */}
      <a href={homeLink} className="text-xl font-bold flex items-center gap-2 text-red-500 hover:text-red-400">
        🚑 <span className="hidden sm:inline">Medical SOS</span>
      </a>

      {/* RIGHT: User Info & Actions */}
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="font-bold text-sm">{user.name}</p>
          <p className="text-xs text-slate-400">{user.role}</p>
        </div>

        <div className="flex gap-3 text-sm">
          <a href="/profile" className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded transition">
            Profile
          </a>
          {/* Specific Links based on Role */}
          {user.role === "PATIENT" && (
            <a href="/appointments" className="px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded transition">
              My Appts
            </a>
          )}
          
          <button 
            onClick={handleLogout} 
            className="px-3 py-2 bg-red-900 hover:bg-red-700 rounded transition border border-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}