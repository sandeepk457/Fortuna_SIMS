/**
 * Fortuna IntelliAI
 * Shared Type Definitions
 */

export type IntelliAIRole =
  | "user"
  | "assistant"
  | "system";

export type IntelliAIMode =
  | "mock"
  | "live";

export type IntelliAIProvider =
  | "mock"
  | "openai";

export type IntelliAIMessage = {
  role: IntelliAIRole;
  content: string;
  timestamp?: string;
};

export type IntelliAIRequest = {
  message: string;

  conversationId?: string;

  userId?: string;

  context?: {
    region?: string;
    branch?: string;
    warehouse?: string;
  };
};

export type IntelliAIResponse = {
  success: boolean;

  message: string;

  mode: IntelliAIMode;

  provider: IntelliAIProvider;

  model: string;

  conversationId?: string;

  timestamp: string;
};

export type IntelliAIToolResult = {
  success: boolean;

  toolName: string;

  data?: unknown;

  error?: string;

  timestamp: string;
};

export type IntelliAIConversation = {
  id: string;

  userId?: string;

  messages: IntelliAIMessage[];

  createdAt: string;

  updatedAt: string;
};