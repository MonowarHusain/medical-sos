"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDriverAssignedCalls,
  updateDriverStatus,
  updateDriverLocation,
  updateCallDriverStatus,
  getUserProfile,
} from "../actions";
import Navbar from "../components/Navbar";

type EmergencyCall = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  driverStatus: string | null;
  createdAt: Date;
  user?: {
    name: string;
    phone: string | null;
  } | null;
};

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role?.toUpperCase() !== "DRIVER") {
          router.push("/");
          return;
        }
        setUser(parsed);

        getUserProfile(parsed.id).then((profile) => {
          if (profile) {
            setIsAvailable(profile.isAvailable);
          }
        });
      } catch (e) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // Auto-refresh calls with proper cleanup
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        const data = await getDriverAssignedCalls(user.id);
        if (isMounted) {
          setCalls(data as unknown as EmergencyCall[]);
          setLoading(false);
        }
      } catch (e) {
        console.error("getDriverAssignedCalls error:", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!user) return;
    const newStatus = !isAvailable;
    const result = await updateDriverStatus(user.id, newStatus);
    if (result.success) {
      setIsAvailable(newStatus);
      setFeedback({
        type: "info",
        text: newStatus ? "You are now marked Available On Duty." : "You are now marked Off Duty.",
      });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Update location
  const handleUpdateLocation = () => {
    if (!user) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await updateDriverLocation(user.id, pos.coords.latitude, pos.coords.longitude);
          if (res.success) {
            setFeedback({
              type: "success",
              text: `Location successfully updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            });
          }
          setTimeout(() => setFeedback(null), 3500);
        },
        () => {
          // Graceful fallback to default Dhaka coordinates
          updateDriverLocation(user.id, 23.8103, 90.4125);
          setFeedback({
            type: "info",
            text: "GPS permission unavailable. Updated location to default Dhaka station.",
          });
          setTimeout(() => setFeedback(null), 3500);
        }
      );
    }
  };

  // Update call status
  const handleStatusUpdate = async (callId: string, newStatus: string) => {
    if (!user) return;
    setActionLoadingId(callId);
    try {
      await updateCallDriverStatus(callId, newStatus, user.id);
      const data = await getDriverAssignedCalls(user.id);
      setCalls(data as unknown as EmergencyCall[]);
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
      case "EN_ROUTE":
        return "bg-amber-950 text-amber-300 border border-amber-800";
      case "ARRIVED":
        return "bg-blue-950 text-blue-300 border border-blue-800";
      case "COMPLETED":
        return "bg-emerald-950 text-emerald-300 border border-emerald-800";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  const getNextStatus = (current: string | null) => {
    switch (current) {
      case "ASSIGNED":
        return { status: "EN_ROUTE", label: "Start Route (En Route)" };
      case "EN_ROUTE":
        return { status: "ARRIVED", label: "Mark Arrived on Scene" };
      case "ARRIVED":
        return { status: "COMPLETED", label: "Complete Mission" };
      default:
        return null;
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Connecting to Driver dispatch...</span>
        </div>
      </div>
    );
  }

  const activeCalls = calls.filter((c) => c.driverStatus !== "COMPLETED");
  const completedCalls = calls.filter((c) => c.driverStatus === "COMPLETED");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>🚑</span>
              <span>Ambulance Driver Console</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live dispatch queue and real-time patient response</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleUpdateLocation}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              📍 Update GPS
            </button>

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
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between transition ${
              feedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : feedback.type === "error"
                ? "bg-red-950/70 border-red-800 text-red-200"
                : "bg-blue-950/70 border-blue-800 text-blue-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Missions</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{activeCalls.length}</p>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Today</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{completedCalls.length}</p>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fleet Status</p>
            <p className={`text-xl font-black mt-2 ${isAvailable ? "text-emerald-400" : "text-red-400"}`}>
              {isAvailable ? "On Duty" : "Off Duty"}
            </p>
          </div>
        </div>

        {/* Active Calls */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🚨</span> Assigned Emergency Calls
          </h2>

          {activeCalls.length === 0 ? (
            <div className="bg-slate-900/40 p-10 rounded-2xl border border-dashed border-slate-800 text-center">
              <span className="text-4xl block mb-2 opacity-40">🚑</span>
              <p className="text-slate-400 font-medium">No active emergency calls assigned.</p>
              <p className="text-slate-500 text-xs mt-1">Remain on duty. You will be alerted when a call is dispatched.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeCalls.map((call) => {
                const nextAction = getNextStatus(call.driverStatus);
                const isUpdating = actionLoadingId === call.id;

                return (
                  <div
                    key={call.id}
                    className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(call.driverStatus)}`}>
                            {call.driverStatus || "PENDING"}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {new Date(call.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>

                        <p className="font-mono text-white text-base">
                          📍 Lat: {call.latitude.toFixed(4)} • Lng: {call.longitude.toFixed(4)}
                        </p>

                        {call.user && (
                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs inline-block">
                            <p className="font-bold text-white">👤 Patient: {call.user.name}</p>
                            {call.user.phone && (
                              <a
                                href={`tel:${call.user.phone}`}
                                className="text-blue-400 hover:underline mt-0.5 block"
                              >
                                📞 {call.user.phone}
                              </a>
                            )}
                          </div>
                        )}

                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${call.latitude},${call.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                          >
                            <span>Open Navigation Map</span>
                            <span>→</span>
                          </a>
                        </div>
                      </div>

                      {nextAction && (
                        <button
                          onClick={() => handleStatusUpdate(call.id, nextAction.status)}
                          disabled={isUpdating}
                          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
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
        {completedCalls.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>✅</span> Completed Missions
            </h2>
            <div className="grid gap-2.5">
              {completedCalls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs"
                >
                  <p className="font-mono text-slate-400">
                    📍 {call.latitude.toFixed(4)}, {call.longitude.toFixed(4)}
                  </p>
                  <span className="text-slate-500 font-mono">
                    {new Date(call.createdAt).toLocaleString()}
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
