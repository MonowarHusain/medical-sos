"use client";

import { useState, useEffect } from "react";
import {
  getEmergencyCallsWithDrivers,
  getAvailableDrivers,
  assignDriverToCall,
  resolveCall,
} from "../actions";

type Driver = {
  id: string;
  name: string;
  phone: string | null;
};

type Call = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  driverStatus: string | null;
  createdAt: Date;
  driver: Driver | null;
  user: {
    name: string;
    phone: string | null;
  } | null;
};

export default function AdminPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshData = async () => {
    try {
      const [latestCalls, availableDrivers] = await Promise.all([
        getEmergencyCallsWithDrivers(),
        getAvailableDrivers(),
      ]);
      setCalls(latestCalls as unknown as Call[]);
      setDrivers(availableDrivers);
    } catch (e) {
      console.error("refreshData error:", e);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (callId: string) => {
    setDispatchingId(callId);
    setFeedback(null);
    try {
      const driverId = selectedDrivers[callId];
      if (driverId) {
        const res = await assignDriverToCall(callId, driverId);
        if (res.success) {
          setFeedback({ type: "success", text: "Driver assigned and dispatched successfully!" });
        } else {
          setFeedback({ type: "error", text: res.error || "Failed to assign driver" });
        }
      } else {
        const res = await resolveCall(callId);
        if (res.success) {
          setFeedback({ type: "success", text: "Emergency call marked as resolved." });
        } else {
          setFeedback({ type: "error", text: res.error || "Failed to resolve call" });
        }
      }
      await refreshData();
    } catch (err) {
      setFeedback({ type: "error", text: "Dispatch action failed" });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDriverSelect = (callId: string, driverId: string) => {
    setSelectedDrivers((prev) => ({ ...prev, [callId]: driverId }));
  };

  const getStatusBadge = (status: string, driverStatus: string | null) => {
    if (status === "RESOLVED") {
      return { bg: "bg-emerald-950 text-emerald-400 border border-emerald-800", label: "RESOLVED" };
    }
    if (driverStatus === "COMPLETED") {
      return { bg: "bg-emerald-950 text-emerald-400 border border-emerald-800", label: "COMPLETED" };
    }
    if (driverStatus === "ARRIVED") {
      return { bg: "bg-blue-950 text-blue-400 border border-blue-800", label: "ARRIVED ON SCENE" };
    }
    if (driverStatus === "EN_ROUTE") {
      return { bg: "bg-amber-950 text-amber-400 border border-amber-800", label: "EN ROUTE" };
    }
    if (driverStatus === "ASSIGNED" || status === "DISPATCHED") {
      return { bg: "bg-yellow-950 text-yellow-300 border border-yellow-800", label: "DISPATCHED" };
    }
    return { bg: "bg-red-950 text-red-300 border border-red-800 animate-pulse", label: "PENDING SOS" };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span>🚨</span> Emergency Dispatch Command
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live incoming SOS signals & active ambulance fleet</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-bold">Available Drivers:</span>
            <span className="text-base font-bold text-emerald-400">{drivers.length}</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Live Sync</span>
          </div>
        </div>
      </div>

      {/* Action feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between transition ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
              : "bg-red-950/60 border-red-800 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✅" : "⚠️"}</span>
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emergency Calls List */}
      <div className="grid gap-4">
        {calls.map((call) => {
          const statusBadge = getStatusBadge(call.status, call.driverStatus);
          const isPending = call.status === "PENDING";
          const isProcessing = dispatchingId === call.id;

          return (
            <div
              key={call.id}
              className={`bg-slate-800/90 rounded-2xl p-5 sm:p-6 border transition-all ${
                isPending ? "border-red-600/60 shadow-lg shadow-red-950/20" : "border-slate-700"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      {new Date(call.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div>
                    {call.user ? (
                      <p className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🆘</span>
                        <span>{call.user.name}</span>
                        {call.user.phone && (
                          <span className="text-sm font-normal text-slate-400">
                            ({call.user.phone})
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🆘</span>
                        <span>Anonymous Patient</span>
                      </p>
                    )}
                    <p className="font-mono text-slate-300 text-sm mt-0.5">
                      📍 Lat: {call.latitude.toFixed(4)} • Lng: {call.longitude.toFixed(4)}
                    </p>
                  </div>

                  {/* Driver Info */}
                  {call.driver && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 inline-block">
                      <p className="text-[11px] text-slate-400 uppercase font-bold">Assigned Ambulance</p>
                      <p className="text-amber-300 font-semibold text-sm">🚗 {call.driver.name}</p>
                      {call.driver.phone && (
                        <p className="text-slate-400 text-xs mt-0.5">📞 {call.driver.phone}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dispatch Controls */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 w-full sm:w-auto">
                    {drivers.length > 0 ? (
                      <select
                        className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white min-w-[200px]"
                        value={selectedDrivers[call.id] || ""}
                        onChange={(e) => handleDriverSelect(call.id, e.target.value)}
                        disabled={isProcessing}
                      >
                        <option value="">Select Ambulance Driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} {driver.phone ? `(${driver.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-lg">
                        ⚠️ No drivers currently available
                      </span>
                    )}

                    <button
                      onClick={() => handleDispatch(call.id)}
                      disabled={isProcessing}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedDrivers[call.id]
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : selectedDrivers[call.id] ? (
                        "ASSIGN DRIVER"
                      ) : (
                        "RESOLVE CALL"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {calls.length === 0 && (
          <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
            <span className="text-4xl block mb-2 opacity-50">🚑</span>
            <p className="text-slate-400 font-medium">No active emergency calls right now.</p>
            <p className="text-slate-500 text-xs mt-1">Live updates will show incoming SOS alerts automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
