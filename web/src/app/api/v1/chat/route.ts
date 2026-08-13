import OpenAI from 'openai';

import { buildSystemPrompt, fetchRelevantScholarships } from '@/lib/chat-rag';
import { resolveCountry } from '@/lib/geo';

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY ?? '',
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      userCountryIso?: string | null;
    };

    const messages = body.messages ?? [];
    if (messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const userGeo =
      body.userCountryIso ? resolveCountry(body.userCountryIso.toUpperCase()) : null;

    // Retrieve scholarship context from DB
    const scholarshipList = await fetchRelevantScholarships(lastUserMessage);
    const systemPrompt = buildSystemPrompt(scholarshipList, userGeo ?? undefined);

    // Stream from NVIDIA Llama
    const stream = await client.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        // Keep last 8 messages for conversational memory
        ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 600,
      temperature: 0.6,
    });

    // Pipe NVIDIA token stream to a plain-text ReadableStream
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[chat] error:', err);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }
}
