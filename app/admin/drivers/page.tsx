"use client";
import { useState, useEffect } from "react";
import { getAllDrivers } from "../../actions";

export default function DriversPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDrivers() {
            const data = await getAllDrivers();
            setDrivers(data);
            setLoading(false);
        }
        fetchDrivers();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">🚑 Ambulance Fleet</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((driver) => (
                    <div key={driver.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg relative group">

                        {/* Status Indicator Stripe */}
                        <div className={`h-1 w-full ${driver.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">{driver.name}</h3>
                                <div className={`w-3 h-3 rounded-full ${driver.isAvailable ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                            </div>

                            <div className="space-y-2 mb-6">
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    📞 {driver.phone || 'No phone'}
                                </p>
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    📍 Lat: {driver.currentLatitude?.toFixed(4) ?? 'N/A'}, Lng: {driver.currentLongitude?.toFixed(4) ?? 'N/A'}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs uppercase text-slate-500 font-bold">Performance</span>
                                    <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full">
                                        {driver.assignedCalls.length} Missions
                                    </span>
                                </div>
                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${Math.min(driver.assignedCalls.length * 10, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Recent Task Info */}
                            {driver.assignedCalls.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-1">Last Mission Status</p>
                                    <p className={`text-sm font-medium ${driver.assignedCalls[0].status === 'RESOLVED' ? 'text-green-400' : 'text-amber-400'
                                        }`}>
                                        {driver.assignedCalls[0].status}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
