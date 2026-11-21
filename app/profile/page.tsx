"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { getUserProfile, updateUserProfile } from "../actions";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        getUserProfile(parsed.id)
          .then((data) => {
            if (data) {
              setUser(data);
            } else {
              setUser(parsed);
            }
          })
          .catch((err) => {
            console.error("getUserProfile error:", err);
            setUser(parsed);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        setLoading(false);
        router.push("/login");
      }
    } else {
      setLoading(false);
      router.push("/login");
    }
  }, [router]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await updateUserProfile(user.id, formData);
      if (res.success) {
        const updatedName = formData.get("name") as string;
        setUser((prev: any) => ({ ...prev, name: updatedName }));

        // Sync local storage
        const localData = JSON.parse(localStorage.getItem("user") || "{}");
        localData.name = updatedName;
        localStorage.setItem("user", JSON.stringify(localData));

        setFeedback({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to update profile." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Network error updating profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Loading user profile...</span>
        </div>
        <p className="text-xs text-slate-500">
          Taking too long?{" "}
          <Link href="/login" className="text-red-400 underline font-semibold">
            Return to Login
          </Link>
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-slate-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>👤</span>
            <span>Account Profile</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account details and security</p>
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : "bg-red-950/70 border-red-800 text-red-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase font-bold">Contact Phone</p>
                  <p className="text-white font-medium mt-1">{user.phone || "Not set"}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase font-bold">Account Status</p>
                  <p className="text-emerald-400 font-bold mt-1">Active Verified</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                  Change Password (Leave blank to keep current)
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="New password (optional)"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
