"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bookAppointment, getUserAppointments, submitPrescription } from "../actions";
import Navbar from "../components/Navbar";

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rxLoadingId, setRxLoadingId] = useState<string | null>(null);
  const [rxTexts, setRxTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user:", e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserAppointments(user.id, user.role);
      setAppointments(data);
      setFetchError(null);
    } catch (e) {
      console.error("getUserAppointments error:", e);
      setFetchError("Failed to load appointments. Please check connection.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [user, fetchData]);

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingFeedback(null);
    setBookingLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("patientId", user.id);

    try {
      const res = await bookAppointment(formData);
      if (res.success) {
        setBookingFeedback({
          type: "success",
          text: "Appointment booked successfully! Our doctors can view your consultation request.",
        });
        (e.target as HTMLFormElement).reset();
        await fetchData();
      } else {
        setBookingFeedback({
          type: "error",
          text: res.error || "Failed to book appointment. Please ensure date is in the future.",
        });
      }
    } catch (err) {
      setBookingFeedback({ type: "error", text: "Network error booking appointment" });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRxSubmit = async (appointmentId: string) => {
    const text = rxTexts[appointmentId];
    if (!text || !text.trim()) return;

    setRxLoadingId(appointmentId);
    try {
      const res = await submitPrescription(appointmentId, text.trim());
      if (res.success) {
        setRxTexts((prev) => ({ ...prev, [appointmentId]: "" }));
        await fetchData();
      }
    } catch (err) {
      console.error("Rx submit error:", err);
    } finally {
      setRxLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Authenticating consultation session...</span>
        </div>
        <p className="text-xs text-slate-500">
          Taking too long?{" "}
          <Link href="/login" className="text-red-400 underline font-semibold">
            Return to Login
          </Link>
        </p>
      </div>
    );
  }

  const role = user.role ? user.role.toUpperCase() : "PATIENT";
  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>{isDoctor ? "👨‍⚕️" : "📅"}</span>
              <span>{isDoctor ? "Doctor Consultation Queue" : "My Medical Appointments"}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {isDoctor
                ? "Review patient consultation requests & write digital prescriptions"
                : "Schedule appointments with qualified doctors & view written prescriptions"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/80 px-3 py-1.5 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider font-mono">
              Live Consult Sync
            </span>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className={`grid gap-8 ${isPatient ? "lg:grid-cols-5" : "grid-cols-1"}`}>
          {/* LEFT: Booking Form (For PATIENTS) */}
          {isPatient && (
            <div className="lg:col-span-2">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>✍️</span> Book New Appointment
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Select your preferred appointment schedule and reason.
                </p>

                {bookingFeedback && (
                  <div
                    className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                      bookingFeedback.type === "success"
                        ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                        : "bg-red-950/70 border-red-800 text-red-200"
                    }`}
                  >
                    <span>{bookingFeedback.type === "success" ? "✅" : "⚠️"}</span>
                    <span>{bookingFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                      Date & Preferred Time *
                    </label>
                    <input
                      name="date"
                      type="datetime-local"
                      required
                      className="w-full p-3 bg-slate-800 rounded-xl text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                      Symptoms / Reason for Visit *
                    </label>
                    <textarea
                      name="reason"
                      placeholder="Describe your health symptoms, e.g. severe headache, fever for 3 days..."
                      required
                      rows={4}
                      className="w-full p-3 bg-slate-800 rounded-xl text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Confirming Booking...</span>
                      </>
                    ) : (
                      "Confirm & Book Visit"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* RIGHT: Appointment Queue / List */}
          <div className={isPatient ? "lg:col-span-3 space-y-4" : "space-y-4 max-w-4xl mx-auto w-full"}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋</span>
                <span>{isDoctor ? "Patient Queue" : "Your Consultation History"}</span>
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                {appointments.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {appointments.map((apt) => {
                const isCompleted = apt.status === "COMPLETED";
                const isSubmittingRx = rxLoadingId === apt.id;

                return (
                  <div
                    key={apt.id}
                    className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <div>
                        <p className="font-bold text-lg text-white">{apt.reason}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          📅 {new Date(apt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                        {isDoctor && (
                          <p className="text-xs text-blue-300 mt-1 font-medium">
                            👤 Patient: {apt.patient?.name || "Patient"} {apt.patient?.phone ? `(${apt.patient.phone})` : ""}
                          </p>
                        )}
                        {isPatient && (
                          <p className="text-xs text-emerald-300 mt-1 font-medium">
                            👨‍⚕️ Doctor: {apt.doctor?.name || "Dr. Assigned on Queue"}
                          </p>
                        )}
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border ${
                          isCompleted
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-blue-950 text-blue-400 border-blue-800"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    {/* Prescription Display */}
                    {apt.prescription ? (
                      <div className="mt-4 bg-slate-950/80 p-4 rounded-xl border border-emerald-900/40">
                        <p className="text-[11px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1.5 mb-1.5">
                          <span>💊</span> Doctor's Written Prescription:
                        </p>
                        <p className="text-slate-100 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                          {apt.prescription}
                        </p>
                        {apt.prescribedAt && (
                          <p className="text-[10px] text-slate-500 mt-2 font-mono">
                            Prescribed on {new Date(apt.prescribedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      isDoctor && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80">
                          <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                            Write Prescription (Rx)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={rxTexts[apt.id] || ""}
                              onChange={(e) =>
                                setRxTexts((prev) => ({ ...prev, [apt.id]: e.target.value }))
                              }
                              placeholder="e.g. Tab. Napa Extra (500mg) 1+0+1 for 3 days after meals..."
                              className="flex-1 p-3 bg-slate-800 rounded-xl text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleRxSubmit(apt.id)}
                              disabled={isSubmittingRx || !rxTexts[apt.id]?.trim()}
                              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmittingRx ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                "Send Rx"
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {appointments.length === 0 && (
                <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                  <span className="text-4xl block mb-2 opacity-40">📅</span>
                  <p className="text-slate-400 font-medium">No appointments found</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isPatient
                      ? "Book your first consultation using the form."
                      : "No consultation requests currently waiting."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
