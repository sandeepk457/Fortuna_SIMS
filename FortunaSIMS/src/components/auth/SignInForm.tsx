"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // (optional) controlled fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ DEMO LOGIN: no backend yet
    // Later: call API, store token, then navigate.
    if (!email.trim() || !password.trim()) {
      alert("Please enter email & password");
      return;
    }

    // optionally remember
    if (isChecked) {
      localStorage.setItem("FORTUNA_KEEP_LOGGED_IN", "1");
    } else {
      localStorage.removeItem("FORTUNA_KEEP_LOGGED_IN");
    }

    // ✅ Navigate to dashboard (/(admin)/page.tsx => "/")
    router.push("/");
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* 🔵 LEFT SIDE – WAREHOUSE BACKGROUND */}
      <div
        className="relative hidden lg:flex lg:w-1/2 items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/auth/signin-bg3.png')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white px-10" />
      </div>

      {/* 🟢 RIGHT SIDE – SIGN IN FORM */}
      <div className="flex flex-col flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Back link */}
          {/* <Link
            href="/"
            className="inline-flex items-center mb-6 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon />
            Back to dashboard
          </Link> */}

          {/* Header */}
          <h1 className="mb-2 text-2xl font-semibold text-gray-800">Sign In</h1>
          <p className="mb-6 text-sm text-gray-500">
            Enter your email and password to sign in!
          </p>

          {/* Form */}
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="info@gmail.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-sm text-gray-600">Keep me logged in</span>
              </div>

              <Link
                href="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Forgot password?
              </Link>
            </div>

            {/* IMPORTANT: submit type */}
            <Button className="w-full" size="sm" type="submit">
              Sign in
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-500 hover:text-brand-600">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
