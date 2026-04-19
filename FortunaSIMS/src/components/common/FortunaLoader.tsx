"use client";
import React from "react";

const FortunaLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      
      <div className="relative flex items-center justify-center">

        {/* 🔄 ROTATING RING */}
        <div className="absolute w-24 h-24 rounded-full 
          border-4 border-transparent
          border-t-red-500 border-r-red-400
          animate-spin">
        </div>

        {/* ✨ GLOW */}
        <div className="absolute w-28 h-28 rounded-full bg-red-500/20 blur-xl"></div>

        {/* 🌐 LOGO */}
        <img
          src="/images/logo/fortuna-globe.png"
          alt="Fortuna"
          className="w-12 h-12"
        />

      </div>
    </div>
  );
};

export default FortunaLoader;