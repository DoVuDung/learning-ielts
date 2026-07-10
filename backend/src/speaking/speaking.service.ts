import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are an English conversation partner helping a Vietnamese learner practice speaking English for IELTS.

Rules:
- Always respond in English only
- Keep replies concise (2-4 sentences max) — this is a conversation, not a lecture
- After your reply, add a short "💡 Feedback:" line noting 1 grammar or vocabulary improvement if needed, or say "✓ Great!" if the learner's message was correct
- Be encouraging and natural
- Ask a follow-up question to keep the conversation going`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class SpeakingService {
  async streamResponse(
    messages: ChatMessage[],
    topic: string,
    userApiKey?: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const serverKey = process.env.ANTHROPIC_API_KEY;
    const apiKey =
      serverKey && serverKey !== 'your-key-here' ? serverKey : userApiKey;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Anthropic API key not configured. Please set your API key in the speaking settings.',
      );
    }

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `${SYSTEM}\n\nCurrent topic: "${topic}"`,
      messages,
    });

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
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
  }
}
