"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHealthCard, saveHealthCard, getUserProfile } from "../actions";
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
            const parsed = JSON.parse(savedUser);
            if (parsed.role?.toUpperCase() !== "PATIENT") {
                router.push("/");
                return;
            }
            setUser(parsed);

            // Fetch health card data
            getHealthCard(parsed.id).then((data) => {
                if (data) {
                    setCard(data);
                }
                setLoading(false);
            });
        } else {
            router.push("/");
        }
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        const formData = new FormData(e.currentTarget);
        const result = await saveHealthCard(user.id, formData);

        if (result.success) {
            // Refresh card data
            const updated = await getHealthCard(user.id);
            if (updated) setCard(updated);
            setIsEditing(false);
            alert("Health Card saved successfully!");
        } else {
            alert("Failed to save. Please try again.");
        }
        setSaving(false);
    };

    if (!user || loading) {
        return <div className="p-10 text-white bg-slate-900 min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <Navbar />

            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-red-400">🏥 Health Card</h1>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all"
                        >
                            ✏️ Edit Card
                        </button>
                    )}
                </div>

                {/* Visual Health Card */}
                {!isEditing && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-br from-red-900 via-red-800 to-slate-900 p-8 rounded-2xl border-2 border-red-700 shadow-2xl relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-600/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-6 relative">
                                <div>
                                    <h2 className="text-xs uppercase tracking-widest text-red-300 font-bold">Medical SOS</h2>
                                    <h3 className="text-2xl font-bold mt-1">{user.name}</h3>
                                    {card.dateOfBirth && (
                                        <p className="text-slate-400 text-sm">DOB: {card.dateOfBirth}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    {card.bloodType ? (
                                        <div className="bg-red-600 px-4 py-2 rounded-lg inline-block shadow-lg">
                                            <span className="text-3xl font-black">{card.bloodType}</span>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-700 px-4 py-2 rounded-lg inline-block">
                                            <span className="text-sm text-slate-400">Blood Type?</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-400 uppercase">Height</p>
                                    <p className="font-bold text-lg">{card.height || "—"}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-400 uppercase">Weight</p>
                                    <p className="font-bold text-lg">{card.weight || "—"}</p>
                                </div>
                            </div>

                            {/* Medical Info */}
                            <div className="space-y-3 mb-6">
                                {card.allergies && (
                                    <div className="bg-orange-900/50 p-3 rounded-lg border border-orange-700">
                                        <p className="text-xs text-orange-300 uppercase font-bold">⚠️ Allergies</p>
                                        <p className="text-orange-100">{card.allergies}</p>
                                    </div>
                                )}
                                {card.conditions && (
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase">Medical Conditions</p>
                                        <p>{card.conditions}</p>
                                    </div>
                                )}
                                {card.medications && (
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase">Current Medications</p>
                                        <p>{card.medications}</p>
                                    </div>
                                )}
                            </div>

                            {/* Emergency Contact */}
                            {card.emergencyName && (
                                <div className="bg-red-950/50 p-4 rounded-lg border border-red-800 mb-4">
                                    <p className="text-xs text-red-300 uppercase font-bold mb-2">🆘 Emergency Contact</p>
                                    <p className="font-bold text-lg">{card.emergencyName}</p>
                                    {card.emergencyRelation && (
                                        <p className="text-slate-400 text-sm">{card.emergencyRelation}</p>
                                    )}
                                    {card.emergencyPhone && (
                                        <p className="text-red-300 font-mono text-lg mt-1">📞 {card.emergencyPhone}</p>
                                    )}
                                </div>
                            )}

                            {/* Insurance */}
                            {card.insuranceProvider && (
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-400 uppercase">Insurance</p>
                                    <p className="font-bold">{card.insuranceProvider}</p>
                                    {card.insuranceNumber && (
                                        <p className="text-slate-400 text-sm font-mono">#{card.insuranceNumber}</p>
                                    )}
                                </div>
                            )}

                            {/* No Data Message */}
                            {!card.bloodType && !card.allergies && !card.emergencyName && (
                                <div className="text-center py-8 text-slate-500">
                                    <p className="text-lg">Your health card is empty</p>
                                    <p className="text-sm mt-2">Click "Edit Card" to add your medical information</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Form */}
                {isEditing && (
                    <form onSubmit={handleSave} className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-lg">
                        <h2 className="text-xl font-bold mb-6 text-blue-400">Edit Health Card</h2>

                        {/* Basic Info */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-slate-400 font-bold mb-3 border-b border-slate-700 pb-2">Basic Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                                    <input name="dateOfBirth" type="date" defaultValue={card.dateOfBirth || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Blood Type</label>
                                    <select name="bloodType" defaultValue={card.bloodType || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none">
                                        <option value="">Select Blood Type</option>
                                        {bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Height</label>
                                    <input name="height" type="text" placeholder="e.g., 5'8 or 172cm" defaultValue={card.height || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Weight</label>
                                    <input name="weight" type="text" placeholder="e.g., 70kg" defaultValue={card.weight || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Medical Info */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-slate-400 font-bold mb-3 border-b border-slate-700 pb-2">Medical Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Allergies (comma separated)</label>
                                    <input name="allergies" type="text" placeholder="e.g., Penicillin, Peanuts" defaultValue={card.allergies || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Medical Conditions</label>
                                    <textarea name="conditions" placeholder="e.g., Diabetes, Hypertension" defaultValue={card.conditions || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none h-20" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Current Medications</label>
                                    <textarea name="medications" placeholder="List current medications..." defaultValue={card.medications || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none h-20" />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-slate-400 font-bold mb-3 border-b border-slate-700 pb-2">🆘 Emergency Contact</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Name</label>
                                    <input name="emergencyName" type="text" placeholder="Contact Name" defaultValue={card.emergencyName || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Phone</label>
                                    <input name="emergencyPhone" type="tel" placeholder="Phone Number" defaultValue={card.emergencyPhone || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                                    <input name="emergencyRelation" type="text" placeholder="e.g., Spouse, Parent" defaultValue={card.emergencyRelation || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Insurance */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-slate-400 font-bold mb-3 border-b border-slate-700 pb-2">Insurance Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Provider</label>
                                    <input name="insuranceProvider" type="text" placeholder="Insurance Company" defaultValue={card.insuranceProvider || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Policy Number</label>
                                    <input name="insuranceNumber" type="text" placeholder="Policy Number" defaultValue={card.insuranceNumber || ""} className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "💾 Save Card"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
