"use client";

import React, { useState, useEffect, useRef } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

export default function DemandForecastAIPage() {
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋\nWelcome to Fortuna IntelliAI\n\nHow can I help you today?",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ✅ Updated handleSend with typing
  const handleSend = () => {
    if (!query.trim()) return;

    const userMsg = { role: "user", text: query };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    setIsTyping(true);

    setTimeout(() => {
      const aiMsg = {
        role: "ai",
        text: `Here’s what I found for "${query}" 👇\n\n• Forecast can be generated\n• Stock risk detected\n\n👉 Suggested: Run Forecast`,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="AI Demand Forecast" />

      <div
        className="min-h-screen rounded-2xl border p-6"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, rgba(200,16,46,0.08), transparent 40%),
            radial-gradient(circle at 85% 25%, rgba(0,95,153,0.08), transparent 40%),
            linear-gradient(135deg, #ffe4e4 0%, #d0e7ff 100%)
          `,
        }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/images/logo/intelliai-logo.png"
            alt="Fortuna IntelliAI"
            className="mx-auto mb-4 w-full max-w-[320px] md:max-w-[420px] lg:max-w-[520px]"
            style={{
              filter: "drop-shadow(0 20px 50px rgba(0,95,153,0.35))",
            }}
          />
        </div>

        {/* Chat */}
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-5 h-[420px] overflow-y-auto space-y-4"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(0,95,153,0.3)",
              boxShadow: "0 10px 30px rgba(0, 95, 153, 0.15)",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
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
                  whiteSpace: "pre-line",
                }}
              >
                {msg.text}
              </div>
            ))}

            {/* ✅ Typing Indicator */}
            {isTyping && (
              <div className="mr-auto bg-white shadow-sm p-3 rounded-xl text-sm max-w-[60%]">
                <div className="flex items-center gap-2">
                  <span>IntelliAI is thinking</span>

                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask IntelliAI..."
              className="flex-1 rounded-xl px-4 py-3 text-sm"
              style={{
                border: "1.5px solid rgba(0,95,153,0.3)",
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            <button
              onClick={handleSend}
              className="px-5 py-3 rounded-xl text-white font-semibold"
              style={{
                backgroundColor: FORTUNA_PRIMARY_RED,
                boxShadow: "0 6px 15px rgba(200,16,46,0.3)",
              }}
            >
              {isTyping
                ? "Thinking..."
                : "Send"}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {["Run Forecast", "Low Stock", "Trend Analysis"].map((action) => (
              <button
                key={action}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  border: "1px solid rgba(0,95,153,0.3)",
                  background: "rgba(255,255,255,0.7)",
                }}
                onClick={() => setQuery(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}