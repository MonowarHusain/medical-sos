"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    getDriverAssignedCalls,
    updateDriverStatus,
    updateDriverLocation,
    updateCallDriverStatus,
    getUserProfile
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
    };
};

export default function DriverDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [calls, setCalls] = useState<EmergencyCall[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.role?.toUpperCase() !== "DRIVER") {
                router.push("/");
                return;
            }
            setUser(parsed);

            // Fetch latest user data to get availability status
            getUserProfile(parsed.id).then((profile) => {
                if (profile) {
                    setIsAvailable(profile.isAvailable);
                }
            });
        } else {
            router.push("/");
        }
    }, []);

    // Auto-refresh calls
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const data = await getDriverAssignedCalls(user.id);
            setCalls(data);
            setLoading(false);
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [user]);

    // Toggle availability
    const handleToggleAvailability = async () => {
        if (!user) return;
        const newStatus = !isAvailable;
        const result = await updateDriverStatus(user.id, newStatus);
        if (result.success) {
            setIsAvailable(newStatus);
        }
    };

    // Update location
    const handleUpdateLocation = () => {
        if (!user) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    await updateDriverLocation(user.id, pos.coords.latitude, pos.coords.longitude);
                    alert("Location updated!");
                },
                () => alert("GPS blocked. Could not update location.")
            );
        } else {
            alert("Geolocation not supported");
        }
    };

    // Update call status
    const handleStatusUpdate = async (callId: string, newStatus: string) => {
        if (!user) return;
        await updateCallDriverStatus(callId, newStatus, user.id);
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "ASSIGNED": return "bg-yellow-600";
            case "EN_ROUTE": return "bg-orange-600";
            case "ARRIVED": return "bg-blue-600";
            case "COMPLETED": return "bg-green-600";
            default: return "bg-gray-600";
        }
    };

    const getNextStatus = (current: string | null) => {
        switch (current) {
            case "ASSIGNED": return { status: "EN_ROUTE", label: "Start Route" };
            case "EN_ROUTE": return { status: "ARRIVED", label: "Mark Arrived" };
            case "ARRIVED": return { status: "COMPLETED", label: "Complete" };
            default: return null;
        }
    };

    if (!user || loading) {
        return <div className="p-10 text-white bg-slate-900 min-h-screen">Loading...</div>;
    }

    const activeCalls = calls.filter(c => c.driverStatus !== "COMPLETED");
    const completedCalls = calls.filter(c => c.driverStatus === "COMPLETED");

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <Navbar />

            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-amber-400">🚑 Driver Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {/* Location Button */}
                        <button
                            onClick={handleUpdateLocation}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-all"
                        >
                            📍 Update Location
                        </button>

                        {/* Availability Toggle */}
                        <button
                            onClick={handleToggleAvailability}
                            className={`px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${isAvailable
                                ? "bg-green-600 hover:bg-green-500 shadow-green-900/50"
                                : "bg-red-700 hover:bg-red-600 shadow-red-900/50"
                                }`}
                        >
                            {isAvailable ? "✅ Available" : "🔴 Unavailable"}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Active Calls</p>
                        <p className="text-4xl font-bold text-amber-400">{activeCalls.length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Completed Today</p>
                        <p className="text-4xl font-bold text-green-400">{completedCalls.length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Status</p>
                        <p className={`text-2xl font-bold ${isAvailable ? "text-green-400" : "text-red-400"}`}>
                            {isAvailable ? "On Duty" : "Off Duty"}
                        </p>
                    </div>
                </div>

                {/* Active Calls Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-amber-300">🔥 Active Emergencies</h2>

                    {activeCalls.length === 0 ? (
                        <div className="bg-slate-800 p-10 rounded-xl border border-slate-700 text-center">
                            <p className="text-slate-500 text-lg">No active calls assigned</p>
                            <p className="text-slate-600 text-sm mt-2">Stay available and wait for dispatch</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {activeCalls.map((call) => {
                                const nextAction = getNextStatus(call.driverStatus);
                                return (
                                    <div
                                        key={call.id}
                                        className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(call.driverStatus)}`}>
                                                        {call.driverStatus || "PENDING"}
                                                    </span>
                                                    <span className="text-slate-400 text-sm">
                                                        {new Date(call.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="font-mono text-slate-300 text-lg">
                                                    📍 Lat: {call.latitude.toFixed(4)} / Lng: {call.longitude.toFixed(4)}
                                                </p>

                                                {/* Patient Details */}
                                                {call.user && (
                                                    <div className="mt-2 bg-slate-900/50 p-2 rounded border border-slate-700">
                                                        <p className="text-sm font-bold text-white">👤 {call.user.name}</p>
                                                        {call.user.phone && (
                                                            <a href={`tel:${call.user.phone}`} className="text-blue-400 text-sm hover:underline block mt-1">
                                                                📞 {call.user.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                <a
                                                    href={`https://www.google.com/maps?q=${call.latitude},${call.longitude}`}
                                                    target="_blank"
                                                    className="text-blue-400 text-sm hover:underline mt-2 inline-block"
                                                >
                                                    Open in Google Maps →
                                                </a>
                                            </div>

                                            {nextAction && (
                                                <button
                                                    onClick={() => handleStatusUpdate(call.id, nextAction.status)}
                                                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg transition-all shadow-lg active:scale-95"
                                                >
                                                    {nextAction.label}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Completed Calls */}
                {completedCalls.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-green-400">✅ Completed</h2>
                        <div className="grid gap-3">
                            {completedCalls.slice(0, 5).map((call) => (
                                <div
                                    key={call.id}
                                    className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50"
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="font-mono text-slate-400 text-sm">
                                            📍 {call.latitude.toFixed(4)}, {call.longitude.toFixed(4)}
                                        </p>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(call.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
