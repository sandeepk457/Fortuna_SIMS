import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/intelliai/model";

import type { IntelliAIRequest } from "@/lib/intelliai/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message = body?.message;

    // ---------------------------------------------------------
    // Validate message
    // ---------------------------------------------------------

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Build IntelliAI request
    // ---------------------------------------------------------

    const aiRequest: IntelliAIRequest = {
      message: message.trim(),

      conversationId:
        typeof body?.conversationId === "string"
          ? body.conversationId
          : undefined,

      userId:
        typeof body?.userId === "string"
          ? body.userId
          : undefined,

      context:
        body?.context &&
        typeof body.context === "object"
          ? {
              region:
                typeof body.context.region === "string"
                  ? body.context.region
                  : undefined,

              branch:
                typeof body.context.branch === "string"
                  ? body.context.branch
                  : undefined,

              warehouse:
                typeof body.context.warehouse === "string"
                  ? body.context.warehouse
                  : undefined,
            }
          : undefined,
    };

    // ---------------------------------------------------------
    // Generate IntelliAI response
    // ---------------------------------------------------------

    const response = await generateAIResponse(aiRequest);

    // ---------------------------------------------------------
    // Return response
    // ---------------------------------------------------------

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error(
      "========== FORTUNA INTELLIAI ERROR =========="
    );

    console.error(error);

    console.error(
      "=============================================="
    );

    const apiError = error as {
      status?: number;
      code?: string;
      message?: string;
      type?: string;
    };

    return NextResponse.json(
      {
        success: false,
        message:
          "Fortuna IntelliAI could not process the request.",

        error: {
          status: apiError?.status ?? null,
          code: apiError?.code ?? null,
          type: apiError?.type ?? null,
          details:
            apiError?.message ??
            "Unknown IntelliAI error",
        },
      },
      { status: 500 }
    );
  }
}