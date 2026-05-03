import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

const SYSTEM = `You are an English conversation partner helping a Vietnamese learner practice speaking English for IELTS.

Rules:
- Always respond in English only
- Keep replies concise (2-4 sentences max) — this is a conversation, not a lecture
- After your reply, add a short "💡 Feedback:" line noting 1 grammar or vocabulary improvement if needed, or say "✓ Great!" if the learner's message was correct
- Be encouraging and natural
- Ask a follow-up question to keep the conversation going`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return new Response("ANTHROPIC_API_KEY is not configured", { status: 503 });
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  let topic: string;
  try {
    const body = await (req.json() as Promise<{ messages: { role: "user" | "assistant"; content: string }[]; topic: string }>);
    ({ messages, topic } = body);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages must be a non-empty array", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `${SYSTEM}\n\nCurrent topic: "${topic}"`,
      messages,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/speaking]", msg);
    return new Response(`Anthropic error: ${msg}`, { status: 502 });
  }
}
