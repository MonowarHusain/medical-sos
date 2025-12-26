"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUserProfile, updateUserProfile } from "../actions";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Load fresh data from server
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);
      getUserProfile(parsed.id).then((data) => {
        setUser(data);
        setLoading(false);
      });
    }
  }, []);

  if (loading) return <div className="p-10 text-white bg-slate-900 min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar /> {/* <--- COMMON UI ADDED HERE */}

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 border-b border-slate-700 pb-4">My Profile</h1>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-6">
              <div>
                <label className="text-slate-400 text-sm uppercase font-bold">Full Name</label>
                <p className="text-xl">{user.name}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm uppercase font-bold">Email</label>
                <p className="text-xl">{user.email}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm uppercase font-bold">Role</label>
                <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded text-sm font-bold">
                  {user.role}
                </span>
              </div>
              
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            // EDIT MODE
            <form action={async (formData) => {
                await updateUserProfile(user.id, formData);
                alert("Profile Updated!");
                setIsEditing(false);
                // Update local storage name too just in case
                const localData = JSON.parse(localStorage.getItem("user") || "{}");
                localData.name = formData.get("name");
                localStorage.setItem("user", JSON.stringify(localData));
                window.location.reload();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Full Name</label>
                  <input name="name" defaultValue={user.name} className="w-full p-3 bg-slate-700 rounded text-white" required />
                </div>
                <div>
                  <label className="block mb-2">Password (Update)</label>
                  <input name="password" defaultValue={user.password} type="text" className="w-full p-3 bg-slate-700 rounded text-white" required />
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}