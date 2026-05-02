import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const { messages, topic } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    topic: string;
  };

  const systemWithTopic = `${SYSTEM}\n\nCurrent topic: "${topic}"`;

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemWithTopic,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
