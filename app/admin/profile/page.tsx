"use client";

export default function AdminProfilePage() {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-white">👤 Admin Profile</h2>

            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-5xl border-4 border-slate-600">
                        👤
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">System Administrator</h3>
                        <p className="text-slate-400">Super User • admin@medical-sos.com</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-900/50 text-blue-400 text-xs rounded-full border border-blue-900">
                            Verified Access
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                        <input
                            type="text"
                            disabled
                            value="Administrator"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white opacity-60 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            disabled
                            value="admin@medical-sos.com"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white opacity-60 cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Security</label>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">System Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <p className="text-slate-500 text-xs uppercase mb-1">Last Login</p>
                        <p className="text-white font-mono text-sm">{new Date().toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <p className="text-slate-500 text-xs uppercase mb-1">Role Permission</p>
                        <p className="text-green-400 text-sm font-bold">FULL ACCESS</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
