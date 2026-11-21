"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { triggerSOS, checkCallStatus, getPatientCalls } from "../actions";
import Navbar from "../components/Navbar";

export default function PatientDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<"IDLE" | "LOCATING" | "WAITING" | "DISPATCHED">("IDLE");
  const [callId, setCallId] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "warning" | "error" | "info" | "success"; text: string } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      router.push("/login");
    }
  }, [router]);

  // Default Dhaka fallback coordinates
  const DHAKA_LAT = 23.8103;
  const DHAKA_LNG = 90.4125;

  const startEmergency = useCallback(async (lat: number, lng: number, isFallback = false) => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userStr ? JSON.parse(userStr) : null;

      if (isFallback) {
        setLocationNote("📍 Default Demo Location: Dhaka (23.8103, 90.4125) • GPS fallback active");
        setFeedback({
          type: "warning",
          text: "GPS was denied or unavailable. Successfully dispatched with default Dhaka coordinates.",
        });
      } else {
        setLocationNote(`📍 Current GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setFeedback({
          type: "info",
          text: "Emergency signal transmitted with live device coordinates.",
        });
      }

      const result = await triggerSOS(lat, lng, user?.id);

      if (result.success && result.callId) {
        setCallId(result.callId);
        setStatus("WAITING");
        setHistoryRefreshKey((k) => k + 1);
      } else {
        setFeedback({
          type: "error",
          text: result.error || "Failed to transmit emergency signal. Please try again or dial 999 directly.",
        });
        setStatus("IDLE");
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: "Network error transmitting emergency call. Please retry.",
      });
      setStatus("IDLE");
    }
  }, []);

  const handleSOS = () => {
    setStatus("LOCATING");
    setFeedback(null);
    setLocationNote(null);

    if (!navigator.geolocation) {
      startEmergency(DHAKA_LAT, DHAKA_LNG, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startEmergency(pos.coords.latitude, pos.coords.longitude, false);
      },
      (err) => {
        // Graceful fallback to default Dhaka coordinates on permission deny, timeout, or error
        startEmergency(DHAKA_LAT, DHAKA_LNG, true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleReset = () => {
    setStatus("IDLE");
    setCallId(null);
    setLocationNote(null);
    setFeedback(null);
  };

  // Status Polling with rigorous unmount cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === "WAITING" && callId) {
      interval = setInterval(async () => {
        const currentStatus = await checkCallStatus(callId);
        if (currentStatus === "RESOLVED" || currentStatus === "DISPATCHED") {
          setStatus("DISPATCHED");
          setHistoryRefreshKey((k) => k + 1);
          setFeedback({
            type: "success",
            text: "Ambulance dispatched! Emergency services are en route.",
          });
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, callId]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            24/7 Rapid Emergency Response
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            EMERGENCY <span className="text-red-500">SOS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            {status === "DISPATCHED"
              ? "Emergency dispatched. Remain at your current location."
              : status === "WAITING"
              ? "Connecting to emergency dispatchers..."
              : status === "LOCATING"
              ? "Acquiring location coordinates..."
              : "Tap the button below immediately for instant ambulance dispatch."}
          </p>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`w-full mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${
              feedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : feedback.type === "warning"
                ? "bg-amber-950/70 border-amber-800 text-amber-200"
                : feedback.type === "error"
                ? "bg-red-950/70 border-red-800 text-red-200"
                : "bg-blue-950/70 border-blue-800 text-blue-200"
            }`}
          >
            <span className="text-lg leading-none">
              {feedback.type === "success"
                ? "✅"
                : feedback.type === "warning"
                ? "⚠️"
                : feedback.type === "error"
                ? "🚨"
                : "ℹ️"}
            </span>
            <div className="flex-1">
              <p className="font-medium">{feedback.text}</p>
              {locationNote && (
                <p className="text-xs mt-1 opacity-80 font-mono">{locationNote}</p>
              )}
            </div>
          </div>
        )}

        {/* SOS Action Area */}
        <div className="my-6 flex flex-col items-center">
          {status === "DISPATCHED" ? (
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 flex flex-col items-center justify-center text-center shadow-[0_0_60px_rgba(16,185,129,0.35)] animate-pulse">
              <span className="text-5xl mb-2">🚑</span>
              <h2 className="text-2xl font-black text-white">HELP IS COMING</h2>
              <p className="text-emerald-100 text-sm font-semibold mt-1">Ambulance Dispatched</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-white text-xs font-bold border border-emerald-500/50 transition"
              >
                Reset / New Call
              </button>
            </div>
          ) : status === "WAITING" ? (
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(245,158,11,0.35)] animate-pulse p-4">
              <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin mb-3" />
              <h2 className="text-2xl font-black text-slate-950">SIGNAL SENT</h2>
              <p className="text-xs font-extrabold text-slate-900 mt-1 uppercase tracking-wider">
                Waiting for Dispatcher...
              </p>
              <span className="text-[11px] font-mono text-slate-950/80 mt-2">Checking every 2s</span>
            </div>
          ) : (
            <button
              onClick={handleSOS}
              disabled={status === "LOCATING"}
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full text-5xl font-black tracking-wider shadow-2xl transition-all duration-300 flex flex-col items-center justify-center relative group ${
                status === "LOCATING"
                  ? "bg-red-900 scale-95 cursor-not-allowed opacity-90 shadow-red-950"
                  : "bg-gradient-to-tr from-red-600 to-rose-500 hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(239,68,68,0.4)]"
              }`}
            >
              <span className="relative z-10 flex flex-col items-center">
                {status === "LOCATING" ? (
                  <>
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                    <span className="text-sm font-bold tracking-normal uppercase">Locating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-black">SOS</span>
                    <span className="text-xs font-bold tracking-widest uppercase mt-1 opacity-90">Press for Help</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-0 group-hover:opacity-20 transition duration-300" />
            </button>
          )}
        </div>

        {/* History Section */}
        <div className="w-full mt-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Emergency Call History
            </h3>
            <span className="text-xs text-slate-500">Live sync</span>
          </div>
          <HistoryList refreshKey={historyRefreshKey} />
        </div>
      </main>
    </div>
  );
}

function HistoryList({ refreshKey }: { refreshKey: number }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.id) {
        const calls = await getPatientCalls(user.id);
        setHistory(calls);
        setError(null);
      }
    } catch (e) {
      console.error("fetchHistory error:", e);
      setError("Failed to load records. Check database connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [refreshKey, fetchHistory]);

  if (loading) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
        <span>Loading call records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center text-sm text-red-200">
        <p className="mb-2">⚠️ {error}</p>
        <button
          onClick={fetchHistory}
          className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-bold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-slate-500 text-sm">No emergency calls logged for this account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((call) => (
        <div
          key={call.id}
          className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center transition hover:border-slate-700"
        >
          <div>
            <p className="text-white font-bold text-sm">
              {new Date(call.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-slate-400 text-xs font-mono">
              {new Date(call.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Lat:{" "}
              {call.latitude.toFixed(2)}, Lng: {call.longitude.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                call.status === "RESOLVED"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : call.status === "PENDING"
                  ? "bg-red-950 text-red-400 border border-red-800 animate-pulse"
                  : "bg-blue-950 text-blue-400 border border-blue-800"
              }`}
            >
              {call.status}
            </span>
            {call.driver && (
              <p className="text-xs text-amber-300 mt-1 font-medium">
                🚗 {call.driver.name}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
