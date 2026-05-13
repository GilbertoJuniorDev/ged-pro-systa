import { NextResponse } from 'next/server';

const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

interface ErrorReportBody {
  source?: 'web-client' | 'web-server';
  message?: unknown;
  stack?: unknown;
  url?: unknown;
  userAgent?: unknown;
  statusCode?: unknown;
  context?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: ErrorReportBody = {};
  try {
    body = (await request.json()) as ErrorReportBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body.message !== 'string' || body.message.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source =
    body.source === 'web-server' ? 'web-server' : 'web-client';

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ?? realIp ?? undefined;

  const userAgent =
    typeof body.userAgent === 'string'
      ? body.userAgent
      : (request.headers.get('user-agent') ?? undefined);

  try {
    await fetch(`${API_BASE}/error-logs/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ip ? { 'X-Forwarded-For': ip } : {}),
      },
      body: JSON.stringify({
        source,
        message: body.message,
        stack: typeof body.stack === 'string' ? body.stack : undefined,
        url: typeof body.url === 'string' ? body.url : undefined,
        userAgent,
        statusCode:
          typeof body.statusCode === 'number' ? body.statusCode : undefined,
        context:
          typeof body.context === 'object' && body.context !== null
            ? body.context
            : undefined,
      }),
    });
  } catch {
    // Fail-safe: nunca derruba o cliente
  }

  return new NextResponse(null, { status: 204 });
}
