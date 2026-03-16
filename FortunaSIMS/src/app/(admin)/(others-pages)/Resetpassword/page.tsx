"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

  const handleSubmit = async (e: any) => {

    e.preventDefault();
    setErr("");

    if (!token) return setErr("Invalid reset link.");
    if (!password) return setErr("Please enter new password.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setSaving(true);

    try {

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!data.ok) {
        setErr(data.message || "Reset failed");
        return;
      }

      setOk(true);

      setTimeout(() => {
        router.push("/signin");
      }, 1500);

    } catch {

      setErr("Server error");

    } finally {

      setSaving(false);

    }

  };

  return (

    <div
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "#E6EEF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999
  }}
>

      {/* SIMS Watermark */}
      <img src="../../../../../public/images/logo/sims-logo.png"
       alt="SIMS Logo"
        style={{
          position: "absolute",
          opacity: 0.06,
          width: "600px"
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "420px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          padding: "35px",
          textAlign: "center"
        }}
      >

        <h2
          style={{
            color: FORTUNA_PRIMARY,
            fontWeight: 700,
            marginBottom: "20px",
            marginTop: "10px"
          }}
        >
          Reset Password
        </h2>

        <p style={{ color: FORTUNA_BLUE, marginBottom: "25px" }}>
 " create a new secure password for your Fortuna SIMS account. Make sure to choose a strong password that you haven't used before."
</p>

        <form onSubmit={handleSubmit}>

          {/* New Password */}
          <div style={{ marginBottom: "15px", textAlign: "left" }}>
            <label style={{ fontSize: "14px" }}>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #dbeafe",
                marginTop: "6px",
                background: "#EFF6FF"
              }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "15px", textAlign: "left" }}>
            <label style={{ fontSize: "14px" }}>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #dbeafe",
                marginTop: "6px",
                background: "#EFF6FF"
              }}
            />
          </div>

          {/* Error */}
          {err && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px"
              }}
            >
              {err}
            </div>
          )}

          {/* Success */}
          {ok && (
            <div
              style={{
                background: "#dcfce7",
                color: "#15803d",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px"
              }}
            >
              Password updated successfully
            </div>
          )}

          {/* Button */}
          <button
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: FORTUNA_PRIMARY,
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {saving ? "Updating..." : "Update Password"}
          </button>

        </form>

        {/* Powered By */}
        <div style={{ marginTop: "30px", opacity: 0.7 }}>
          <p style={{ fontSize: "12px" }}>Powered by
            <img src="/images/logo/fortuna-global.png" alt="Fortuna Global Logo"
            style={{ width: "300px", marginTop: "-4px"}} />
          </p>

          <img
            src="/images/logo/sims-logo.png"
            alt="Fortuna SIMS Logo"
            style={{ width: "150px",marginTop: "5px" }}
          />
        </div>

      </div>

    </div>

  );

}