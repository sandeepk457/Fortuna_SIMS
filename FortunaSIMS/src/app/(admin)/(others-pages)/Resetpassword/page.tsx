"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const FORTUNA_PRIMARY = "#C8102E";
const FORTUNA_BLUE = "#005F99";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!token) return setErr("Invalid reset link.");
    if (!password) return setErr("Please enter new password.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setSaving(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.message || "Reset failed.");
        return;
      }

      setOk(true);
      setTimeout(() => router.push("/signin"), 900);
    } catch {
      setErr("Server error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div className="h-1.5" style={{ background: FORTUNA_PRIMARY }} />
        <div className="p-6">
          <Link href="/signin" className="text-sm hover:underline" style={{ color: FORTUNA_PRIMARY }}>
            ← Back to Sign In
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-800">New Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-[#EFF6FF] px-4 py-3 outline-none focus:ring-2"
                style={{ "--tw-ring-color": FORTUNA_BLUE }}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">Confirm Password *</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-[#EFF6FF] px-4 py-3 outline-none focus:ring-2"
                style={{ "--tw-ring-color": FORTUNA_BLUE }}
                placeholder="Confirm new password"
              />
            </div>

            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            {ok ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Password updated successfully. Redirecting…
              </div>
            ) : null}

            <button
              disabled={saving}
              className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60"
              style={{ background: FORTUNA_PRIMARY }}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}