import { buildSystemPrompt, fetchRelevantScholarships } from '@/lib/chat-rag';
import { resolveCountry } from '@/lib/geo';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { type NextRequest } from 'next/server';

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'meta/llama-3.1-8b-instruct';
const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  const { limited } = await checkRateLimit(getClientIp(req), 'chat', 20, '1 m');
  if (limited) {
    return new Response('Too many requests. Please wait a moment before sending another message.', { status: 429 });
  }

  try {
    const body = (await req.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      userCountryIso?: string | null;
    };

    const messages = body.messages ?? [];
    if (messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const userGeo = body.userCountryIso
      ? resolveCountry(body.userCountryIso.toUpperCase())
      : null;

    // RAG: fetch relevant scholarships and build system prompt
    const scholarshipList = await fetchRelevantScholarships(lastUserMessage);
    const systemPrompt = buildSystemPrompt(scholarshipList, userGeo ?? undefined);

    // Raw fetch → NVIDIA NIM SSE (more reliable than openai SDK async iteration)
    const nvRes = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8),
        ],
        stream: true,
        max_tokens: 600,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!nvRes.ok || !nvRes.body) {
      const errText = await nvRes.text().catch(() => '');
      console.error('[chat] NVIDIA error', nvRes.status, errText.slice(0, 200));
      return new Response(
        'The AI advisor is temporarily unavailable. Please try again in a moment.',
        { status: 502 },
      );
    }

    // Parse SSE `data: {...}` lines, extract delta.content, stream as plain text
    const upstream = nvRes.body;
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = upstream.getReader();
        const dec = new TextDecoder();
        let buf = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;

              try {
                const chunk = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const token = chunk.choices?.[0]?.delta?.content ?? '';
                if (token) controller.enqueue(encoder.encode(token));
              } catch {
                // malformed JSON chunk — skip
              }
            }
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
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return new Response('The AI advisor timed out. Please try again.', { status: 504 });
    }
    console.error('[chat] error:', err);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }
}
