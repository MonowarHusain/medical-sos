"use client";
import { useState, useEffect } from "react";
import { getAllPatients } from "../../actions";

export default function PatientsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPatients() {
            const data = await getAllPatients();
            setPatients(data);
            setLoading(false);
        }
        fetchPatients();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">🤒 Patient Records</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {patients.map((patient) => (
                    <div key={patient.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-sm hover:border-slate-600 transition-all">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400 text-xl font-bold">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{patient.name}</h3>
                                        <p className="text-sm text-slate-400">{patient.email}</p>
                                    </div>
                                </div>
                                {patient.healthCard?.bloodType && (
                                    <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg text-sm font-bold border border-red-900/50">
                                        🩸 {patient.healthCard.bloodType}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Health Card Info */}
                        <div className="p-6 space-y-4">
                            {patient.healthCard ? (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-900/50 p-3 rounded">
                                        <p className="text-slate-500 text-xs uppercase mb-1">Physical</p>
                                        <p className="text-slate-300">Height: {patient.healthCard.height || 'N/A'}</p>
                                        <p className="text-slate-300">Weight: {patient.healthCard.weight || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded">
                                        <p className="text-slate-500 text-xs uppercase mb-1">Emergency Contact</p>
                                        <p className="text-slate-300">{patient.healthCard.emergencyName || 'N/A'}</p>
                                        <p className="text-slate-400 text-xs">{patient.healthCard.emergencyPhone}</p>
                                    </div>
                                    {(patient.healthCard.allergies || patient.healthCard.conditions) && (
                                        <div className="col-span-2 bg-red-900/10 p-3 rounded border border-red-900/20">
                                            <p className="text-slate-500 text-xs uppercase mb-1">Medical Alerts</p>
                                            {patient.healthCard.allergies && (
                                                <p className="text-red-300 text-xs">⚠️ Allergies: {patient.healthCard.allergies}</p>
                                            )}
                                            {patient.healthCard.conditions && (
                                                <p className="text-amber-300 text-xs">🩺 Conditions: {patient.healthCard.conditions}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-slate-900/30 rounded border border-dashed border-slate-700">
                                    <p className="text-slate-500">No health card created</p>
                                </div>
                            )}

                            {/* Order History Summary */}
                            {patient.orders && patient.orders.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase mb-2">Recent Orders</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {patient.orders.map((order: any) => (
                                            <div key={order.id} className="bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 whitespace-nowrap">
                                                ${order.total} <span className={order.status === 'DELIVERED' ? 'text-green-400' : 'text-amber-400'}>• {order.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
