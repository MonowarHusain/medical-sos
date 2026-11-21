"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 bg-red-950/80 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-xs text-slate-400 mb-4 font-mono break-words bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-left">
          {error.message || "An unexpected error occurred in application render."}
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-slate-500 mb-6">
            Digest: <span className="text-slate-400 select-all">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/login"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
