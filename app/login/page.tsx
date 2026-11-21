"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../actions";
import { getRoleRoute } from "@/lib/roleRoutes";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form input state for smooth 1-click viva demo fill
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role) {
          router.replace(getRoleRoute(parsed.role));
        }
      }
    } catch {
      // Keep on login page
    }
  }, [router]);

  const redirectByRole = (userRole: string) => {
    router.push(getRoleRoute(userRole));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        const result = await registerUser({ name, email, password, role });
        if (result.success) {
          setIsRegister(false);
          setSuccess("Account created successfully! Please log in.");
        } else {
          setError(result.error || "Registration failed. Please check your information.");
        }
      } else {
        const result = await loginUser({ email, password });
        if (result.success && result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
          redirectByRole(result.user.role);
        } else {
          setError(result.error || "Invalid email or password");
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoRole: string) => {
    setError("");
    setSuccess("");
    setEmail(demoEmail);
    setPassword("123456");
    setLoading(true);

    try {
      const result = await loginUser({ email: demoEmail, password: "123456" });
      if (result.success && result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        redirectByRole(result.user.role || demoRole);
      } else {
        setError(result.error || `Could not log into ${demoEmail}. Ensure database is seeded.`);
      }
    } catch (err) {
      console.error(err);
      setError("Demo login network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 sm:p-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-500/20 mb-4">
            <span className="text-3xl">🚑</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Medical SOS</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-center text-slate-100">
            {isRegister ? "Join Medical SOS" : "Welcome Back"}
          </h2>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-2.5">
              <span className="text-lg leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm flex items-start gap-2.5">
              <span className="text-lg leading-none">✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">System Role</label>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="DRIVER">Ambulance Driver</option>
                  <option value="DELIVERY">Medicine Delivery Rider</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p
            className="text-center mt-5 text-slate-400 text-sm cursor-pointer hover:text-white transition select-none"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
          >
            {isRegister ? "Already have an account? Sign In" : "New here? Create Account"}
          </p>

          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  ⚡ Viva Demo: 9 Multi-Role Accounts
                </p>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-mono">
                  PWD: 123456
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Patients */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    Patients
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("pat1@test.com", "PATIENT")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="pat1@test.com / 123456 -> /patient"
                    >
                      <span>🤒 Patient 1</span>
                      <span className="text-[10px] opacity-60 font-mono">pat1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("pat2@test.com", "PATIENT")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="pat2@test.com / 123456 -> /patient"
                    >
                      <span>🤒 Patient 2</span>
                      <span className="text-[10px] opacity-60 font-mono">pat2</span>
                    </button>
                  </div>
                </div>

                {/* Doctors */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Doctors
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("doc1@test.com", "DOCTOR")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="doc1@test.com / 123456 -> /appointments"
                    >
                      <span>👨‍⚕️ Doctor 1</span>
                      <span className="text-[10px] opacity-60 font-mono">doc1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("doc2@test.com", "DOCTOR")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="doc2@test.com / 123456 -> /appointments"
                    >
                      <span>👨‍⚕️ Doctor 2</span>
                      <span className="text-[10px] opacity-60 font-mono">doc2</span>
                    </button>
                  </div>
                </div>

                {/* Ambulance Drivers */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Ambulance Drivers
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("dri1@test.com", "DRIVER")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="dri1@test.com / 123456 -> /driver"
                    >
                      <span>🚑 Driver 1</span>
                      <span className="text-[10px] opacity-60 font-mono">dri1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("dri2@test.com", "DRIVER")}
                      disabled={loading}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="dri2@test.com / 123456 -> /driver"
                    >
                      <span>🚑 Driver 2</span>
                      <span className="text-[10px] opacity-60 font-mono">dri2</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Couriers & Admin */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Couriers & Admin
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("deli1@test.com", "DELIVERY")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="deli1@test.com / 123456 -> /delivery"
                    >
                      <span>🛵 Rider 1</span>
                      <span className="text-[10px] opacity-60 font-mono">deli1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("deli2@test.com", "DELIVERY")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="deli2@test.com / 123456 -> /delivery"
                    >
                      <span>🛵 Rider 2</span>
                      <span className="text-[10px] opacity-60 font-mono">deli2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo("admin@test.com", "ADMIN")}
                      disabled={loading}
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-200 transition disabled:opacity-50 text-left flex items-center justify-between active:scale-95"
                      title="admin@test.com / 123456 -> /admin"
                    >
                      <span>🚨 Admin</span>
                      <span className="text-[10px] opacity-60 font-mono">admin</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
