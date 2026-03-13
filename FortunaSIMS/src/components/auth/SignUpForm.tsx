"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [fullName,setFullName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPassword,setConfirmPassword] = useState("")

  const handleSubmit = async (e) => {

  e.preventDefault()

  if(password !== confirmPassword){
    alert("Passwords do not match")
    return
  }

  try{

    const res = await fetch("http://localhost:5000/api/auth/signup",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        full_name:fullName,
        email:email,
        password:password,
        terms_accepted:isChecked
      })
    })

    const data = await res.json()

    if(data.success){
      alert("Account created successfully")
    }else{
      alert(data.message)
    }

  }catch(err){
    console.log(err)
  }

}

  return (
    <div className="flex min-h-screen w-full">

      {/* 🔵 LEFT SIDE – WAREHOUSE BACKGROUND */}
      <div
        className="relative hidden lg:flex lg:w-1/2 items-center justify-center
                   bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/auth/signin-bg3.png')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Optional branding (future use) */}
        <div className="relative z-10 text-center text-white px-10">
          {/* Logo / Text if needed */}
        </div>
      </div>

      {/* 🟢 RIGHT SIDE – SIGN UP FORM */}
      <div className="flex flex-col flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center mb-6 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon />
            Back to dashboard
          </Link>

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
              <Input type="text"placeholder="Your full name"value={fullName}onChange={(e)=>setFullName(e.target.value)}/>
            </div>

            {/* Email */}
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
  type="email"
  placeholder="info@gmail.com"
  value={email}
  onChange={(e)=>setEmail(e.target.value)}
/>
            </div>

            {/* Password */}
            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label>
                Confirm Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
  type={showConfirmPassword ? "text" : "password"}
  placeholder="Confirm your password"
  value={confirmPassword}
  onChange={(e)=>setConfirmPassword(e.target.value)}
/>
                <span
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </span>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-sm text-gray-600">
                I agree to the Terms & Conditions
              </span>
            </div>

            {/* Submit */}
            <Button className="w-full" size="sm" type="submit">
            Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-center text-gray-600">
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
