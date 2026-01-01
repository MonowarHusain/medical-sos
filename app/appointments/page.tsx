"use client";
import { useState, useEffect } from "react";
import { bookAppointment, getUserAppointments, submitPrescription } from "../actions";
import Navbar from "../components/Navbar";

export default function AppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  // 1. Load User on Startup
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. AUTO-REFRESH LOGIC (The Fix)
  // This runs every 2 seconds to fetch the latest data
  useEffect(() => {
    if (!user) return; // Don't fetch if no user

    const fetchData = async () => {
      const data = await getUserAppointments(user.id, user.role);
      // We only update if the data is actually different to avoid screen flickering
      // (React handles this efficienty, so simple set is fine for this demo)
      setAppointments(data);
    };

    fetchData(); // Fetch immediately
    const interval = setInterval(fetchData, 2000); // Then every 2 seconds

    return () => clearInterval(interval); // Cleanup on close
  }, [user]);

  if (!user) return <div className="p-10 text-white bg-slate-900 min-h-screen">Loading...</div>;

  const role = user.role ? user.role.toUpperCase() : "PATIENT";
  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            {isDoctor ? "👨‍⚕️ Doctor Dashboard" : "📅 My Appointments"}
          </h1>
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400 font-mono">LIVE SYNC</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* LEFT: Booking Form (Only for PATIENT) */}
          {isPatient && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-lg">
              <h2 className="text-xl font-bold mb-4">Book New Appointment</h2>
              <form action={async (formData) => {
                await bookAppointment(formData);
                // No need to reload! The interval will catch it in 2 seconds.
                alert("Appointment Booked!");
              }}>
                <input type="hidden" name="patientId" value={user.id} />
                <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                <input name="date" type="datetime-local" required className="w-full p-3 bg-slate-700 rounded mb-4 text-white border border-slate-600 focus:border-blue-500 outline-none" />
                <label className="block text-sm text-gray-400 mb-1">Reason for Visit</label>
                <textarea name="reason" placeholder="e.g. Fever, Checkup..." required className="w-full p-3 bg-slate-700 rounded mb-4 text-white h-24 border border-slate-600 focus:border-blue-500 outline-none"></textarea>
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold transition-all shadow-md">Confirm Booking</button>
              </form>
            </div>
          )}

          {/* RIGHT: Appointment List (For BOTH) */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isDoctor ? "Patient Queue" : "Upcoming Visits"}
            </h2>

            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg text-slate-100">{apt.reason}</p>
                      <p className="text-sm text-gray-400">{new Date(apt.date).toLocaleString()}</p>
                      {isDoctor && <p className="text-xs text-blue-300 mt-1">Patient: {apt.patient?.name || "Unknown"}</p>}
                      {isPatient && <p className="text-xs text-green-300 mt-1">Doctor: {apt.doctor?.name || "Pending Assignment"}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold border ${apt.status === 'COMPLETED' ? 'bg-green-900 text-green-200 border-green-700' : 'bg-yellow-900 text-yellow-200 border-yellow-700'}`}>
                      {apt.status}
                    </span>
                  </div>

                  {/* PRESCRIPTION DISPLAY */}
                  {apt.prescription && (
                    <div className="mt-3 bg-slate-800 p-3 rounded border border-slate-600 animate-pulse">
                      {/* animate-pulse helps show it's "fresh" */}
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">💊 Prescription:</p>
                      <p className="text-green-300 font-mono text-sm">{apt.prescription}</p>
                    </div>
                  )}

                  {/* DOCTOR INPUT (Only if no prescription yet) */}
                  {isDoctor && !apt.prescription && (
                    <form action={async (formData) => {
                      const text = formData.get("text") as string;
                      await submitPrescription(apt.id, text);
                      // No reload needed
                    }} className="mt-3 flex gap-2">
                      <input name="text" placeholder="Write Rx..." className="flex-1 p-2 bg-slate-900 rounded text-sm text-white border border-slate-600" required />
                      <button className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-bold">Send</button>
                    </form>
                  )}

                </div>
              ))}

              {appointments.length === 0 && <p className="text-gray-500 italic">No appointments found.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}