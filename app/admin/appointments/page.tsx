"use client";
import { useState, useEffect } from "react";
import { getAllAppointments } from "../../actions";

export default function AllAppointmentsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            const data = await getAllAppointments();
            setAppointments(data);
            setLoading(false);
        }
        fetchAppointments();
    }, []);

    if (loading) return <div>Loading...</div>;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-900/50 text-green-400 border-green-900';
            case 'CONFIRMED': return 'bg-blue-900/50 text-blue-400 border-blue-900';
            case 'PENDING': return 'bg-amber-900/50 text-amber-400 border-amber-900';
            default: return 'bg-slate-700 text-slate-400 border-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">📅 All Appointments</h2>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900 text-slate-200 uppercase font-bold">
                            <tr>
                                <th className="p-4">Date/Time</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Doctor</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {appointments.map((appt) => (
                                <tr key={appt.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 text-white font-medium">
                                        {new Date(appt.date).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <p className="text-white">{appt.patient.name}</p>
                                        <p className="text-xs text-slate-500">{appt.patient.email}</p>
                                    </td>
                                    <td className="p-4 text-blue-300">
                                        👨‍md {appt.doctor?.name || 'Unassigned'}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {appt.reason}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${getStatusStyle(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {appt.prescription ? (
                                            <span className="text-green-400 text-xs">✅ Prescribed</span>
                                        ) : (
                                            <span className="text-slate-500 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                        No appointments found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
