"use client";
import { useState, useEffect } from "react";
import { getEmergencyCallsWithDrivers, getAvailableDrivers, assignDriverToCall, resolveCall } from "../actions";
// Navbar import removed

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

  const refreshData = async () => {
    const [latestCalls, availableDrivers] = await Promise.all([
      getEmergencyCallsWithDrivers(),
      getAvailableDrivers()
    ]);
    setCalls(latestCalls);
    setDrivers(availableDrivers);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (callId: string) => {
    const driverId = selectedDrivers[callId];
    if (driverId) {
      await assignDriverToCall(callId, driverId);
    } else {
      await resolveCall(callId);
    }
    refreshData();
  };

  const handleDriverSelect = (callId: string, driverId: string) => {
    setSelectedDrivers(prev => ({ ...prev, [callId]: driverId }));
  };

  const getStatusBadge = (status: string, driverStatus: string | null) => {
    if (status === "RESOLVED") {
      return { bg: "bg-green-900 text-green-200", label: "RESOLVED" };
    }
    if (driverStatus === "COMPLETED") {
      return { bg: "bg-green-900 text-green-200", label: "COMPLETED" };
    }
    if (driverStatus === "ARRIVED") {
      return { bg: "bg-blue-900 text-blue-200", label: "ARRIVED" };
    }
    if (driverStatus === "EN_ROUTE") {
      return { bg: "bg-orange-900 text-orange-200", label: "EN ROUTE" };
    }
    if (driverStatus === "ASSIGNED") {
      return { bg: "bg-yellow-900 text-yellow-200", label: "ASSIGNED" };
    }
    if (status === "DISPATCHED") {
      return { bg: "bg-yellow-900 text-yellow-200", label: "DISPATCHED" };
    }
    return { bg: "bg-red-900 text-red-200 animate-pulse", label: "PENDING" };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">



      <div className="p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">🚑 Emergency Dispatch</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <span className="text-sm text-slate-400">Available Drivers:</span>
              <span className="text-lg font-bold text-green-400">{drivers.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-green-400 font-medium">Live Updating</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {calls.map((call) => {
            const statusBadge = getStatusBadge(call.status, call.driverStatus);
            const isPending = call.status === 'PENDING';

            return (
              <div key={call.id} className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-slate-400 text-sm font-mono">
                        {new Date(call.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="mb-2">
                      {call.user ? (
                        <p className="text-lg font-bold text-white">
                          🆘 {call.user.name} <span className="text-sm font-normal text-slate-400">({call.user.phone || 'No Phone'})</span>
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-white">🆘 Unknown Patient</p>
                      )}
                      <p className="font-mono text-slate-300 text-sm mt-1">📍 Lat: {call.latitude.toFixed(4)} / Lng: {call.longitude.toFixed(4)}</p>
                    </div>

                    {/* Driver Info */}
                    {call.driver && (
                      <div className="mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Assigned Driver</p>
                        <p className="text-amber-300 font-medium">🚗 {call.driver.name}</p>
                        {call.driver.phone && (
                          <p className="text-slate-400 text-sm">📞 {call.driver.phone}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dispatch Controls */}
                  {isPending && (
                    <div className="flex flex-col gap-3 items-end">
                      {drivers.length > 0 && (
                        <select
                          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                          value={selectedDrivers[call.id] || ""}
                          onChange={(e) => handleDriverSelect(call.id, e.target.value)}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() => handleDispatch(call.id)}
                        className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${selectedDrivers[call.id]
                          ? "bg-amber-600 hover:bg-amber-500 text-white"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                          }`}
                      >
                        {selectedDrivers[call.id] ? "ASSIGN DRIVER" : "QUICK DISPATCH"}
                      </button>

                      {drivers.length === 0 && (
                        <p className="text-xs text-red-400">No drivers available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {calls.length === 0 && (
            <div className="text-center text-slate-500 py-10">No active emergencies</div>
          )}
        </div>
      </div>
    </div>
  );
}