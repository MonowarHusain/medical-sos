"use client";
import { useState, useEffect } from "react";
import { getAllDoctors } from "../../actions";

export default function DoctorsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDoctors() {
            const data = await getAllDoctors();
            setDoctors(data);
            setLoading(false);
        }
        fetchDoctors();
    }, []);

    if (loading) return <div className="text-white">Loading doctors...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">👨‍⚕️ Doctors Management</h2>
                <span className="bg-slate-800 text-blue-400 px-4 py-2 rounded-full text-sm font-bold border border-slate-700">
                    Total: {doctors.length}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {doctors.map((doc) => (
                    <div key={doc.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-3xl">
                                    👨‍⚕️
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{doc.name}</h3>
                                    <p className="text-slate-400">{doc.email}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-900">
                                        active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Sections */}
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* UPCOMING / ACTIVE */}
                            <div className="bg-slate-900/50 rounded-lg p-4 h-fit">
                                <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">📅 Upcoming / Active Queue</h4>
                                {doc.appointmentsAsDoctor.filter((a: any) => !a.prescription).length > 0 ? (
                                    <div className="space-y-3">
                                        {doc.appointmentsAsDoctor.filter((a: any) => !a.prescription).map((appt: any) => (
                                            <div key={appt.id} className="bg-slate-800 p-3 rounded border border-l-4 border-l-blue-500 border-slate-700/50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">👤 {appt.patient.name}</p>
                                                        <p className="text-xs text-blue-300">📅 {new Date(appt.date).toLocaleString()}</p>
                                                        <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500 text-xs uppercase font-bold">Issue:</span> {appt.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-end">
                                                    <span className="text-[10px] uppercase font-bold bg-blue-900/30 text-blue-400 px-2 py-1 rounded">Pending Action</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic py-4">No active appointments.</p>
                                )}
                            </div>

                            {/* HISTORY / SERVED */}
                            <div className="bg-slate-900/50 rounded-lg p-4 h-fit">
                                <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">✅ Served Patient History</h4>
                                {doc.appointmentsAsDoctor.filter((a: any) => a.prescription).length > 0 ? (
                                    <div className="space-y-3">
                                        {doc.appointmentsAsDoctor.filter((a: any) => a.prescription).map((appt: any) => (
                                            <div key={appt.id} className="bg-slate-800 p-3 rounded border border-l-4 border-l-green-500 border-slate-700/50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">👤 {appt.patient.name}</p>
                                                        <p className="text-xs text-slate-400">📅 {new Date(appt.date).toLocaleString()}</p>
                                                    </div>
                                                    <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded font-bold">Done</span>
                                                </div>

                                                <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Issue Reported</p>
                                                    <p className="text-sm text-slate-300 mb-2">{appt.reason}</p>

                                                    <p className="text-xs text-green-400 uppercase font-bold">Rx Prescribed</p>
                                                    <p className="text-sm text-white font-mono bg-slate-900 p-2 rounded border border-slate-700">{appt.prescription}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic py-4">No served patients yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
