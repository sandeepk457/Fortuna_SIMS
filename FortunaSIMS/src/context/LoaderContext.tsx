"use client";

import React, { createContext, useState, useEffect } from "react";
import FortunaLoader from "@/components/common/FortunaLoader";
import api from "@/utils/api";

export const LoaderContext = createContext<any>(null);

export const LoaderProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🔄 REQUEST INTERCEPTOR
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        setLoading(true);
        return config;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    // 🔄 RESPONSE INTERCEPTOR
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        setLoading(false);
        return response;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    // 🧹 CLEANUP
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <LoaderContext.Provider value={{ loading }}>
      {loading && <FortunaLoader />}
      {children}
    </LoaderContext.Provider>
  );
};