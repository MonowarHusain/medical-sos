"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDeliveryManAssignedOrders,
  updateDriverStatus,
  updateOrderDeliveryStatus,
  getUserProfile,
} from "../actions";
import { getRoleRoute } from "@/lib/roleRoutes";
import Navbar from "../components/Navbar";

type Order = {
  id: string;
  total: number;
  status: string;
  deliveryStatus: string | null;
  deliveryAddress: string | null;
  createdAt: Date;
  user: {
    name: string;
    phone: string | null;
  };
};

export default function DeliveryDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "info"; text: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const parsedRole = parsed.role?.toUpperCase();
          if (parsedRole !== "DELIVERY_MAN" && parsedRole !== "DELIVERY") {
            router.replace(getRoleRoute(parsedRole));
            return;
          }
          setUser(parsed);

          getUserProfile(parsed.id).then((profile) => {
            if (profile) {
              setIsAvailable(profile.isAvailable);
            }
          });
        } catch {
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("user-session-updated", checkAuth);
    window.addEventListener("user-state-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("user-session-updated", checkAuth);
      window.removeEventListener("user-state-change", checkAuth);
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        const data = await getDeliveryManAssignedOrders(user.id);
        if (isMounted) {
          setOrders(data as unknown as Order[]);
        }
      } catch (e) {
        console.error("getDeliveryManAssignedOrders error:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newStatus = !isAvailable;
    const result = await updateDriverStatus(user.id, newStatus);
    if (result.success) {
      setIsAvailable(newStatus);
      setFeedback({
        type: "info",
        text: newStatus ? "You are now Available On Duty." : "You are now Off Duty.",
      });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!user) return;
    setActionLoadingId(orderId);
    try {
      await updateOrderDeliveryStatus(orderId, newStatus, user.id);
      const data = await getDeliveryManAssignedOrders(user.id);
      setOrders(data as unknown as Order[]);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-yellow-950 text-yellow-300 border border-yellow-800";
      case "PICKED_UP":
        return "bg-amber-950 text-amber-300 border border-amber-800";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-950 text-blue-300 border border-blue-800";
      case "DELIVERED":
        return "bg-emerald-950 text-emerald-300 border border-emerald-800";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  const getNextStatus = (current: string | null) => {
    switch (current) {
      case "ASSIGNED":
        return { status: "PICKED_UP", label: "Pick Up Package" };
      case "PICKED_UP":
        return { status: "OUT_FOR_DELIVERY", label: "Start Delivery Route" };
      case "OUT_FOR_DELIVERY":
        return { status: "DELIVERED", label: "Mark Delivered" };
      default:
        return null;
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Connecting to Courier dispatch...</span>
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

  const activeOrders = orders.filter((o) => o.deliveryStatus !== "DELIVERED");
  const completedOrders = orders.filter((o) => o.deliveryStatus === "DELIVERED");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>🛵</span>
              <span>Medicine Delivery Console</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Pharmacy courier assignments & delivery route</p>
          </div>

          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isAvailable
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                : "bg-red-700 hover:bg-red-600 text-white shadow-red-950/40"
            }`}
          >
            {isAvailable ? "✅ Available On Duty" : "🔴 Off Duty"}
          </button>
        </div>

        {feedback && (
          <div className="mb-6 p-4 rounded-xl text-sm border bg-blue-950/70 border-blue-800 text-blue-200 flex items-center justify-between">
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Deliveries</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{activeOrders.length}</p>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Today</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{completedOrders.length}</p>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status</p>
            <p className={`text-xl font-black mt-2 ${isAvailable ? "text-emerald-400" : "text-red-400"}`}>
              {isAvailable ? "On Duty" : "Off Duty"}
            </p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📦</span> Assigned Orders to Deliver
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-slate-900/40 p-10 rounded-2xl border border-dashed border-slate-800 text-center">
              <span className="text-4xl block mb-2 opacity-40">🛵</span>
              <p className="text-slate-400 font-medium">No active delivery packages assigned.</p>
              <p className="text-slate-500 text-xs mt-1">Remain on duty to receive incoming medicine orders.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeOrders.map((order) => {
                const nextAction = getNextStatus(order.deliveryStatus);
                const isUpdating = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.deliveryStatus)}`}>
                            {order.deliveryStatus || "PENDING"}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {new Date(order.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>

                        <p className="text-lg font-bold text-emerald-400">
                          Total Amount: ${order.total.toFixed(2)}
                        </p>
                        <p className="text-white text-sm">
                          👤 Customer: <span className="font-semibold">{order.user.name}</span>
                          {order.user.phone && (
                            <span className="text-slate-400 ml-2">({order.user.phone})</span>
                          )}
                        </p>
                        {order.deliveryAddress && (
                          <p className="text-blue-300 text-xs font-medium">
                            📍 {order.deliveryAddress}
                          </p>
                        )}
                      </div>

                      {nextAction && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                          disabled={isUpdating}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            nextAction.label
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed History */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>✅</span> Delivered Packages
            </h2>
            <div className="grid gap-2.5">
              {completedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-emerald-400">${order.total.toFixed(2)}</span>
                    <span className="text-slate-300 ml-2">• Delivered to {order.user.name}</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
