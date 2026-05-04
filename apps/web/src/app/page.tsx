"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status === "ok" ? "online" : "offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold tracking-tight">PaperManthan</h1>
      <p className="text-zinc-400 text-lg">मंथन — Churn the paper. Extract the wisdom.</p>
      <div className="mt-6 flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            backendStatus === "online"
              ? "bg-green-400"
              : backendStatus === "offline"
              ? "bg-red-400"
              : "bg-yellow-400 animate-pulse"
          }`}
        />
        <span className="text-zinc-400">
          {backendStatus === "checking"
            ? "Connecting to backend..."
            : backendStatus === "online"
            ? "Backend online"
            : "Backend offline"}
        </span>
      </div>
    </main>
  );
}
