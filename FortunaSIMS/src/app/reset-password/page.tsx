"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { EyeIcon, EyeCloseIcon } from "@/icons";

export default function ResetPasswordPage() {

const searchParams = useSearchParams();
const token = searchParams.get("token");

const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const validatePassword = (pwd: string) => {


if (pwd.length < 8) {
  return "Password must be at least 8 characters";
}

if (!/[A-Z]/.test(pwd)) {
  return "Password must contain at least one uppercase letter";
}

if (!/[0-9]/.test(pwd)) {
  return "Password must contain at least one number";
}

return "";


};

const handleSubmit = async (e: any) => {


e.preventDefault();
setError("");

const validationError = validatePassword(password);

if (validationError) {
  setError(validationError);
  return;
}

if (password !== confirmPassword) {
  setError("Passwords do not match");
  return;
}

try {

  setLoading(true);

  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      password
    })
  });

  const data = await res.json();

  if (data.ok) {
    alert("Password updated successfully");
    window.location.href = "/signin";
  } else {
    setError("Failed to reset password");
  }

} catch (err) {
  setError("Something went wrong");
} finally {
  setLoading(false);
}


};

return (


<div className="flex items-center justify-center min-h-screen bg-gray-100">

  <div className="bg-white p-8 rounded-xl shadow-lg w-[400px]">

    <h2 className="text-2xl font-semibold text-center mb-6">
      Reset Password
    </h2>

    {error && (
      <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit}>

      {/* New Password */}

      <div className="mb-4">

        <label className="block text-sm mb-2">
          New Password
        </label>

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            className="w-full border rounded-lg px-3 py-2 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <EyeCloseIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

        </div>

      </div>


      {/* Confirm Password */}

      <div className="mb-6">

        <label className="block text-sm mb-2">
          Confirm Password
        </label>

        <div className="relative">

          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            className="w-full border rounded-lg px-3 py-2 pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <EyeCloseIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

        </div>

      </div>


      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded-lg disabled:opacity-60"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>

    </form>

  </div>
</div>
);
}
