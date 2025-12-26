"use client";
import { useState, useEffect } from "react";
import { getEmergencyCalls, resolveCall } from "../actions";
import Navbar from "../components/Navbar"; // <--- 1. IMPORT NAVBAR

type Call = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
};

export default function AdminPage() {
  const [calls, setCalls] = useState<Call[]>([]);

  const refreshData = async () => {
    const latestCalls = await getEmergencyCalls();
    setCalls(latestCalls);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (id: string) => {
    await resolveCall(id);
    refreshData();
  };

  return (
    // Changed to bg-slate-900 to match your other pages (Dark Mode)
    <div className="min-h-screen bg-slate-900 text-white">
      
      <Navbar /> {/* <--- 2. ADD NAVBAR HERE */}

      <div className="p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">🚑 Emergency Dispatch</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-green-400 font-medium">Live Updating</span>
          </div>
        </div>
        
        <div className="grid gap-4">
          {calls.map((call) => (
            <div key={call.id} className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${call.status === 'PENDING' ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-green-900 text-green-200'}`}>
                    {call.status}
                  </span>
                  <span className="text-slate-400 text-sm">{new Date(call.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="font-mono text-slate-300">📍 Lat: {call.latitude.toFixed(4)} / Lng: {call.longitude.toFixed(4)}</p>
              </div>
              
              {call.status === 'PENDING' && (
                <button 
                  onClick={() => handleDispatch(call.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95"
                >
                  DISPATCH AMBULANCE
                </button>
              )}
            </div>
          ))}
          
          {calls.length === 0 && (
            <div className="text-center text-slate-500 py-10">No active emergencies</div>
          )}
        </div>
      </div>
    </div>
  );
}