import { type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { csvUploads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    return new Response('Unauthorized', { status: 401 });
  }

  const { uploadId: rawId } = await params;
  const uploadId = parseInt(rawId, 10);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      while (true) {
        const db = getDb();
        const [record] = await db
          .select()
          .from(csvUploads)
          .where(eq(csvUploads.id, uploadId));

        if (!record) {
          send({ error: 'not_found' });
          break;
        }

        const total = Array.isArray(record.rows) ? (record.rows as unknown[]).length : 0;
        send({
          totalProcessed: record.totalProcessed,
          total,
          status: record.status,
        });

        if (record.status === 'completed' || record.status === 'error') break;

        await new Promise((r) => setTimeout(r, 2500));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
