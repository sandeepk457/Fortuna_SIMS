"use client";

import { useEffect, useMemo, useState } from "react";

const FORTUNA_PRIMARY = "#C8102E";
const FORTUNA_BLUE = "#005F99";

export default function ForgotPasswordPopup({ open, onClose, onSent }) {

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const isValidEmail = useMemo(() => {
    const v = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [email]);

  useEffect(() => {
    if (open) {
      setEmail("");
      setMsg("");
      setErr("");
      setSending(false);
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && open && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // ✅ ADD THIS FUNCTION
  const handleSend = async (e) => {
    e.preventDefault();

    if (!isValidEmail) {
      setErr("Enter valid email");
      return;
    }

    try {

      setSending(true);
      setErr("");
      setMsg("");

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await res.json();

      if (data.ok) {
        setMsg("Reset link sent. Please check your email.");
        onSent?.();
      } else {
        setErr("Unable to send reset link.");
      }

    } catch (error) {

      console.error(error);
      setErr("Server error");

    } finally {

      setSending(false);

    }
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* Top Accent */}
        <div className="h-1.5" style={{ background: FORTUNA_PRIMARY }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <div className="text-xl font-semibold text-gray-900">
              Forgot Password
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Enter your email to receive a reset link.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-100 grid place-items-center text-gray-700"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-800">
              Email <span style={{ color: FORTUNA_PRIMARY }}>*</span>
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@company.com"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-[#EFF6FF] px-4 py-3 outline-none focus:ring-2"
              style={{ "--tw-ring-color": FORTUNA_BLUE }}
            />

            <div className="mt-2 text-xs text-gray-500">
              We’ll send a secure reset link to your inbox.
            </div>
          </div>

          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {msg}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 font-semibold border border-gray-200 hover:bg-gray-50 text-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={sending}
              className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
              style={{ background: FORTUNA_PRIMARY }}
            >
              {sending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}