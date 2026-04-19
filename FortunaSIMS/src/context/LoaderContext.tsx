"use client";
import React, { createContext, useState } from "react";
import FortunaLoader from "@/components/common/FortunaLoader";

export const LoaderContext = createContext<any>(null);

export const LoaderProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {loading && <FortunaLoader />}
      {children}
    </LoaderContext.Provider>
  );
};