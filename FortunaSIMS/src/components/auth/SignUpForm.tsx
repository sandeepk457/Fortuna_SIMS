
"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

const FormInput = Input as React.ComponentType<
  React.InputHTMLAttributes<HTMLInputElement>
>;

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isLoading) return;

    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validation
    if (!trimmedName) {
      alert("Please enter your full name");
      return;
    }

    if (!normalizedEmail) {
      alert("Please enter your email address");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Mobile number must be 10 digits");
      return;
    }

    if (password.length < 8 || password.length > 10) {
      alert("Password must be 8 to 10 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!isChecked) {
      alert("Please accept the Terms & Conditions");
      return;
    }

    // Environment variable
    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is not configured");
      alert("Server configuration error. Please contact support.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: trimmedName,
          email: normalizedEmail,
          mobile: mobile,
          password: password,
          terms_accepted: isChecked,
        }),
      });

      // Safely parse response
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const message =
          data?.message ||
          `Signup failed. Server returned status ${res.status}`;

        alert(message);
        return;
      }

      alert("Account created successfully");

      // Redirect to Sign In
      window.location.href = "/signin";
    } catch (error) {
      console.error("Signup request failed:", error);

      alert(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* LEFT SIDE – WAREHOUSE BACKGROUND */}
      <div
        className="relative hidden lg:flex lg:w-1/2 items-center justify-center
                   bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/auth/signin-bg3.png')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Optional branding */}
        <div className="relative z-10 px-10 text-center text-white">
          {/* Logo / Branding */}
        </div>
      </div>

      {/* RIGHT SIDE – SIGN UP FORM */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <h1 className="mb-2 text-2xl font-semibold text-gray-800">
            Sign Up
          </h1>

          <p className="mb-6 text-sm text-gray-500">
            Create your account to get started!
          </p>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <Label>
                Full Name <span className="text-error-500">*</span>
              </Label>

              <FormInput
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>

              <FormInput
                type="email"
                placeholder="info@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <Label>
                Mobile Number <span className="text-error-500">*</span>
              </Label>

              <FormInput
                type="text"
                placeholder="Enter mobile number"
                value={mobile}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  if (value.length <= 10) {
                    setMobile(value);
                  }
                }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>

              <div className="relative">
                <FormInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  minLength={8}
                  maxLength={10}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label>
                Confirm Password <span className="text-error-500">*</span>
              </Label>

              <div className="relative">
                <FormInput
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  minLength={8}
                  maxLength={10}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isChecked}
                onChange={setIsChecked}
              />

              <span className="text-sm text-gray-600">
                I agree to the Terms & Conditions
              </span>
            </div>

            {/* Submit */}
            <Button
              className="w-full"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-brand-500 hover:text-brand-600"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}