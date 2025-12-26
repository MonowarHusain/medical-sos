"use client";
import { useState, useEffect } from "react";
import { triggerSOS, checkCallStatus } from "./actions";
import Navbar from "./components/Navbar"; // <--- 1. IMPORT NAVBAR

export default function Home() {
  const [status, setStatus] = useState("IDLE"); // IDLE, LOADING, WAITING, DISPATCHED
  const [callId, setCallId] = useState<string | null>(null);

  // 1. Handle the Click
  const handleSOS = () => {
    setStatus("LOADING");

    const startEmergency = async (lat: number, lng: number) => {
      const result = await triggerSOS(lat, lng);
      if (result.success && result.callId) {
        setCallId(result.callId);
        setStatus("WAITING"); // Now we wait for Admin
      } else {
        alert("Failed to connect.");
        setStatus("IDLE");
      }
    };

    if (!navigator.geolocation) {
      startEmergency(23.8103, 90.4125); // Demo Location
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => startEmergency(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        alert("GPS Blocked. Sending Demo Location.");
        startEmergency(23.8103, 90.4125);
      }
    );
  };

  // 2. The "Polling" Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "WAITING" && callId) {
      interval = setInterval(async () => {
        const currentStatus = await checkCallStatus(callId);
        console.log("Checking status...", currentStatus);
        
        if (currentStatus === "RESOLVED") {
          setStatus("DISPATCHED");
          clearInterval(interval); 
        }
      }, 2000); 
    }

    return () => clearInterval(interval);
  }, [status, callId]);

  return (
    // Changed bg-gray-900 to bg-slate-900 to match Admin/Doctor pages exactly
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      
      <Navbar /> {/* <--- 2. ADD NAVBAR HERE */}

      {/* 3. WRAP CONTENT IN FLEX CONTAINER TO KEEP IT CENTERED */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        
        <h1 className="text-3xl font-bold text-red-500 tracking-widest">EMERGENCY SYSTEM</h1>
        
        {/* STATE 1: SUCCESS (Green) */}
        {status === "DISPATCHED" && (
          <div className="p-10 bg-green-600 rounded-2xl animate-pulse text-center shadow-[0_0_50px_rgba(22,163,74,0.6)]">
            <h2 className="text-3xl font-bold">HELP IS COMING</h2>
            <p className="text-lg mt-2 font-semibold">Ambulance Dispatched</p>
          </div>
        )}

        {/* STATE 2: WAITING FOR ADMIN (Yellow/Orange) */}
        {status === "WAITING" && (
          <div className="w-64 h-64 rounded-full bg-orange-500 flex flex-col items-center justify-center animate-pulse shadow-lg">
            <h2 className="text-2xl font-bold text-black">SENT</h2>
            <p className="text-xs text-black font-bold mt-2">WAITING FOR DISPATCH...</p>
          </div>
        )}

        {/* STATE 3: IDLE / LOADING (Red) */}
        {(status === "IDLE" || status === "LOADING") && (
          <button
            onClick={handleSOS}
            disabled={status === "LOADING"}
            className={`w-64 h-64 rounded-full text-4xl font-black shadow-lg transition-all ${
              status === "LOADING" ? "bg-red-800 scale-95" : "bg-red-600 hover:scale-105 active:scale-95"
            }`}
          >
            {status === "LOADING" ? "..." : "SOS"}
          </button>
        )}
        
        <p className="text-gray-400 text-sm max-w-xs text-center">
          {status === "DISPATCHED" 
            ? "Stay where you are." 
            : status === "WAITING" 
            ? "Operator is reviewing your location." 
            : "Tap immediately for emergency help."}
        </p>
      </div>
    </div>
  );
}