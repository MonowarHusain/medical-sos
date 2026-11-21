"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHealthCard, saveHealthCard } from "../actions";
import Navbar from "../components/Navbar";

type HealthCardData = {
  dateOfBirth: string | null;
  bloodType: string | null;
  height: string | null;
  weight: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
};

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HealthCardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [card, setCard] = useState<HealthCardData>({
    dateOfBirth: null,
    bloodType: null,
    height: null,
    weight: null,
    allergies: null,
    conditions: null,
    medications: null,
    emergencyName: null,
    emergencyPhone: null,
    emergencyRelation: null,
    insuranceProvider: null,
    insuranceNumber: null,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role?.toUpperCase() !== "PATIENT") {
          router.push("/");
          return;
        }
        setUser(parsed);

        getHealthCard(parsed.id)
          .then((data) => {
            if (data) {
              setCard(data);
            }
          })
          .catch((err) => {
            console.error("getHealthCard error:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        router.push("/login");
        setLoading(false);
      }
    } else {
      router.push("/login");
      setLoading(false);
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await saveHealthCard(user.id, formData);
      if (result.success) {
        const updated = await getHealthCard(user.id);
        if (updated) setCard(updated);
        setIsEditing(false);
        setFeedback({ type: "success", text: "Emergency Health Card saved successfully!" });
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to save health card." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Network error saving health card." });
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Loading Health Card...</span>
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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>🏥</span>
              <span>Emergency Health Card</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Critical medical profile accessible to responding paramedics & ER doctors
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setFeedback(null);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm shadow-md transition active:scale-95"
            >
              ✏️ Edit Card Info
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : "bg-red-950/70 border-red-800 text-red-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Visual Emergency Card */}
        {!isEditing && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-red-800/80 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-red-400 uppercase">
                    EMERGENCY MEDICAL ID
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">{user.name}</h2>
                  {card.dateOfBirth && (
                    <p className="text-slate-300 text-xs mt-1">DOB: {card.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  {card.bloodType ? (
                    <div className="bg-red-600 text-white px-5 py-2.5 rounded-2xl shadow-xl text-center">
                      <span className="text-xs uppercase font-bold tracking-wider block opacity-80">
                        Blood Type
                      </span>
                      <span className="text-3xl font-black">{card.bloodType}</span>
                    </div>
                  ) : (
                    <div className="bg-slate-800/80 px-4 py-2 rounded-xl text-xs text-slate-400 border border-slate-700">
                      Blood Type Unset
                    </div>
                  )}
                </div>
              </div>

              {/* Physical stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Height</p>
                  <p className="font-bold text-base text-white mt-0.5">{card.height || "—"}</p>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Weight</p>
                  <p className="font-bold text-base text-white mt-0.5">{card.weight || "—"}</p>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-3 mb-5">
                {card.allergies && (
                  <div className="bg-amber-950/60 p-4 rounded-xl border border-amber-800/80">
                    <p className="text-xs text-amber-300 uppercase font-bold flex items-center gap-1.5 mb-1">
                      <span>⚠️</span> Known Allergies
                    </p>
                    <p className="text-sm text-amber-100 font-medium">{card.allergies}</p>
                  </div>
                )}

                {card.conditions && (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                      🩺 Chronic Medical Conditions
                    </p>
                    <p className="text-sm text-slate-200">{card.conditions}</p>
                  </div>
                )}

                {card.medications && (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                      💊 Ongoing Medications
                    </p>
                    <p className="text-sm text-slate-200">{card.medications}</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {card.emergencyName && (
                <div className="bg-red-950/80 p-4 rounded-xl border border-red-800 mb-4">
                  <p className="text-xs text-red-300 uppercase font-bold mb-1 flex items-center gap-1.5">
                    <span>🆘</span> Designated Emergency Contact
                  </p>
                  <p className="font-bold text-base text-white">
                    {card.emergencyName}{" "}
                    {card.emergencyRelation && (
                      <span className="text-xs font-normal text-slate-300">
                        ({card.emergencyRelation})
                      </span>
                    )}
                  </p>
                  {card.emergencyPhone && (
                    <p className="text-red-300 font-mono text-base font-bold mt-1">
                      📞 {card.emergencyPhone}
                    </p>
                  )}
                </div>
              )}

              {/* Insurance */}
              {card.insuranceProvider && (
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-400 uppercase font-bold">Health Insurance: </span>
                  <span className="text-white font-semibold">{card.insuranceProvider}</span>
                  {card.insuranceNumber && (
                    <span className="text-slate-400 font-mono ml-2">
                      (Policy #{card.insuranceNumber})
                    </span>
                  )}
                </div>
              )}

              {!card.bloodType && !card.allergies && !card.emergencyName && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Your emergency medical card is currently blank.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Edit Card Info" to add vital allergies, blood group, and emergency contact.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6"
          >
            <div>
              <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-3 border-b border-slate-800 pb-2">
                1. Basic Physical Profile
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    defaultValue={card.dateOfBirth || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Blood Type</label>
                  <select
                    name="bloodType"
                    defaultValue={card.bloodType || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodTypes.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height</label>
                  <input
                    name="height"
                    type="text"
                    placeholder="e.g. 5'9 or 175cm"
                    defaultValue={card.height || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Weight</label>
                  <input
                    name="weight"
                    type="text"
                    placeholder="e.g. 72kg"
                    defaultValue={card.weight || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-3 border-b border-slate-800 pb-2">
                2. Medical History & Alerts
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Known Allergies (Penicillin, Aspirin, Peanuts, etc.)
                  </label>
                  <input
                    name="allergies"
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                    defaultValue={card.allergies || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Chronic Conditions</label>
                  <textarea
                    name="conditions"
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    defaultValue={card.conditions || ""}
                    rows={2}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Current Prescribed Medications</label>
                  <textarea
                    name="medications"
                    placeholder="e.g. Metformin 500mg, Losartan 50mg daily"
                    defaultValue={card.medications || ""}
                    rows={2}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-3 border-b border-slate-800 pb-2">
                3. Primary Emergency Contact
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contact Name</label>
                  <input
                    name="emergencyName"
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    defaultValue={card.emergencyName || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input
                    name="emergencyPhone"
                    type="tel"
                    placeholder="+880 1700..."
                    defaultValue={card.emergencyPhone || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                  <input
                    name="emergencyRelation"
                    type="text"
                    placeholder="e.g. Spouse / Sibling"
                    defaultValue={card.emergencyRelation || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-3 border-b border-slate-800 pb-2">
                4. Health Insurance
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Provider Name</label>
                  <input
                    name="insuranceProvider"
                    type="text"
                    placeholder="e.g. MetLife, Green Delta"
                    defaultValue={card.insuranceProvider || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Policy / Member #</label>
                  <input
                    name="insuranceNumber"
                    type="text"
                    placeholder="Policy number"
                    defaultValue={card.insuranceNumber || ""}
                    className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Card...</span>
                  </>
                ) : (
                  "💾 Save Health Card"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
