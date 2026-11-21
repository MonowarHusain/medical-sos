"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "./actions";

export default function HomePage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if already logged in, redirect immediately
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const role = user.role?.toUpperCase();
        if (role === "ADMIN") router.push("/admin");
        else if (role === "DOCTOR") router.push("/appointments");
        else if (role === "DRIVER") router.push("/driver");
        else if (role === "DELIVERY_MAN") router.push("/delivery");
        else router.push("/patient");
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, [router]);

  const redirectByRole = (role: string) => {
    const normalized = role?.toUpperCase();
    if (normalized === "ADMIN") router.push("/admin");
    else if (normalized === "DOCTOR") router.push("/appointments");
    else if (normalized === "DRIVER") router.push("/driver");
    else if (normalized === "DELIVERY_MAN") router.push("/delivery");
    else router.push("/patient");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (isRegister) {
        const result = await registerUser(formData);
        if (result.success) {
          setIsRegister(false);
          setSuccess("Account created successfully! Please log in.");
        } else {
          setError(result.error || "Registration failed. Please check your information.");
        }
      } else {
        const result = await loginUser(formData);
        if (result.success && result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
          redirectByRole(result.user.role);
        } else {
          setError(result.error || "Invalid email or password");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (email: string) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", "123456");

    try {
      const result = await loginUser(formData);
      if (result.success && result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        redirectByRole(result.user.role);
      } else {
        setError(`Could not log into ${email}. Ensure database is seeded.`);
      }
    } catch (err) {
      setError("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 sm:p-6">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-500/20 mb-4">
            <span className="text-3xl">🚑</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Medical SOS</h1>
          <p className="text-slate-400 text-sm mt-1">Emergency Dispatch & Healthcare System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-center text-slate-100">
            {isRegister ? "Create Your Account" : "Sign In to Continue"}
          </h2>

          {/* Feedback Banners */}
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
                required
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">System Role</label>
                <select
                  name="role"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                >
                  <option value="PATIENT">Patient (Emergency SOS & Care)</option>
                  <option value="DOCTOR">Doctor (Consultations & Rx)</option>
                  <option value="DRIVER">Ambulance Driver (Dispatch Response)</option>
                  <option value="DELIVERY_MAN">Medicine Delivery (Fleet Courier)</option>
                  <option value="ADMIN">Administrator (Central Operations)</option>
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
            {isRegister ? "Already have an account? Sign In" : "New to Medical SOS? Create an Account"}
          </p>

          {/* Quick Demo Credentials */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  ⚡ Viva & Demo One-Click Logins
                </p>
                <span className="text-[10px] text-slate-500 font-mono">PWD: 123456</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("patient@test.com")}
                  disabled={loading}
                  className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50 text-center"
                  title="patient@test.com / 123456"
                >
                  🤒 Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("doctor@test.com")}
                  disabled={loading}
                  className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50 text-center"
                  title="doctor@test.com / 123456"
                >
                  👨‍⚕️ Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin@test.com")}
                  disabled={loading}
                  className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50 text-center"
                  title="admin@test.com / 123456"
                >
                  🚨 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("driver@test.com")}
                  disabled={loading}
                  className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50 text-center"
                  title="driver@test.com / 123456"
                >
                  🚑 Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("delivery@test.com")}
                  disabled={loading}
                  className="col-span-2 px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50 text-center"
                  title="delivery@test.com / 123456"
                >
                  🛵 Medicine Courier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
