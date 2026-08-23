"use client";

import React, { useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function DemandForecastAIPage() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text:
        "Hi 👋\nWelcome to Fortuna IntelliAI\n\nHow can I help you today?",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSend = async (messageOverride?: string) => {
    const userMessage = (
      messageOverride ?? query
    ).trim();

    if (!userMessage || isTyping) {
      return;
    }

    // ---------------------------------------------------------
    // Add user message
    // ---------------------------------------------------------

    const userMsg: Message = {
      role: "user",
      text: userMessage,
    };

    setMessages((prev) => [
      ...prev,
      userMsg,
    ]);

    setQuery("");
    setIsTyping(true);

    try {
      // -------------------------------------------------------
      // Fortuna IntelliAI API
      // -------------------------------------------------------

      const response = await fetch(
        "/api/intelliai",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: userMessage,
          }),
        }
      );

      const data = await response.json();

      // -------------------------------------------------------
      // API ERROR
      // -------------------------------------------------------

      if (!response.ok || !data?.success) {
        const errorDetails =
          data?.error?.details ||
          data?.message ||
          "Fortuna IntelliAI request failed.";

        throw new Error(errorDetails);
      }

      // -------------------------------------------------------
      // AI RESPONSE
      // -------------------------------------------------------

      const aiMessage: Message = {
        role: "ai",
        text:
          data?.message ||
          "Fortuna IntelliAI did not return a response.",
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      console.error(
        "Fortuna IntelliAI UI Error:",
        error
      );

      // -------------------------------------------------------
      // Friendly error shown to user
      // -------------------------------------------------------

      const errorMessage: Message = {
        role: "ai",
        text:
          "Sorry, I couldn't process your request right now.\n\n" +
          "Please try again in a moment.",
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // =========================================================
  // QUICK ACTION
  // =========================================================

  const handleQuickAction = (
    action: string
  ) => {
    handleSend(action);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-4">
      <PageBreadcrumb
        pageTitle="AI Demand Forecast"
      />

      <div
        className="min-h-screen rounded-2xl border p-6"
        style={{
          background: `
            radial-gradient(
              circle at 15% 20%,
              rgba(200,16,46,0.08),
              transparent 40%
            ),
            radial-gradient(
              circle at 85% 25%,
              rgba(0,95,153,0.08),
              transparent 40%
            ),
            linear-gradient(
              135deg,
              #ffe4e4 0%,
              #d0e7ff 100%
            )
          `,
        }}
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="text-center mb-10">
          <img
            src="/images/logo/intelliai-logo.png"
            alt="Fortuna IntelliAI"
            className="mx-auto mb-4 w-full max-w-[320px] md:max-w-[420px] lg:max-w-[520px]"
            style={{
              filter:
                "drop-shadow(0 20px 50px rgba(0,95,153,0.35))",
            }}
          />

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background:
                "rgba(255,255,255,0.75)",
              border:
                "1px solid rgba(0,95,153,0.18)",
              color: FORTUNA_SECONDARY_BLUE,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#16a34a",
              }}
            />

            IntelliAI Development Mode
          </div>
        </div>

        {/* =====================================================
            CHAT
        ====================================================== */}

        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-5 h-[420px] overflow-y-auto space-y-4"
            style={{
              background:
                "rgba(255,255,255,0.65)",

              backdropFilter:
                "blur(14px)",

              border:
                "1.5px solid rgba(0,95,153,0.3)",

              boxShadow:
                "0 10px 30px rgba(0,95,153,0.15)",
            }}
          >
            {/* =================================================
                MESSAGES
            ================================================== */}

            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-100 text-right"
                      : "mr-auto bg-white shadow-sm"
                  }`}
                  style={{
                    border:
                      msg.role === "user"
                        ? "1px solid rgba(0,95,153,0.2)"
                        : "1px solid rgba(0,0,0,0.05)",

                    whiteSpace:
                      "pre-line",
                  }}
                >
                  {msg.text}
                </div>
              )
            )}

            {/* =================================================
                TYPING INDICATOR
            ================================================== */}

            {isTyping && (
              <div
                className="mr-auto bg-white shadow-sm p-3 rounded-xl text-sm max-w-[60%]"
              >
                <div className="flex items-center gap-2">
                  <span>
                    IntelliAI is thinking
                  </span>

                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />

                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />

                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}

            {/* =================================================
                AUTO SCROLL ANCHOR
            ================================================== */}

            <div ref={chatEndRef} />
          </div>

          {/* ===================================================
              INPUT
          ==================================================== */}

          <div className="flex gap-2 mt-4">
            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Ask IntelliAI..."
              disabled={isTyping}
              className="flex-1 rounded-xl px-4 py-3 text-sm disabled:opacity-60"
              style={{
                border:
                  "1.5px solid rgba(0,95,153,0.3)",

                outline: "none",

                background:
                  "rgba(255,255,255,0.8)",
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  handleSend();
                }
              }}
            />

            <button
              onClick={() =>
                handleSend()
              }
              disabled={
                !query.trim() ||
                isTyping
              }
              className="px-5 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  FORTUNA_PRIMARY_RED,

                boxShadow:
                  "0 6px 15px rgba(200,16,46,0.3)",
              }}
            >
              {isTyping
                ? "Thinking..."
                : "Send"}
            </button>
          </div>

          {/* ===================================================
              QUICK ACTIONS
          ==================================================== */}

          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {[
              "Run Forecast",
              "Low Stock",
              "Trend Analysis",
            ].map(
              (action) => (
                <button
                  key={action}
                  onClick={() =>
                    handleQuickAction(
                      action
                    )
                  }
                  disabled={isTyping}
                  className="px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50"
                  style={{
                    border:
                      "1px solid rgba(0,95,153,0.3)",

                    background:
                      "rgba(255,255,255,0.7)",

                    color:
                      FORTUNA_SECONDARY_BLUE,
                  }}
                >
                  {action}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}