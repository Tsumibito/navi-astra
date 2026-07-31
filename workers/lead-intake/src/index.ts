interface LeadSubmission {
  submissionId: string
  kind: 'contact' | 'newsletter'
  email: string
  consent: true
  [key: string]: unknown
}

interface Env {
  LEAD_QUEUE: Queue<LeadSubmission>
  PAYLOAD_LEAD_URL: string
}

const allowedOrigins = new Set(['https://navi.training', 'https://www.navi.training'])

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function response(body: Record<string, unknown>, origin: string, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...cors(origin) },
  })
}

function validSubmission(value: unknown): value is LeadSubmission {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return /^[a-zA-Z0-9_-]{16,100}$/.test(String(data.submissionId || ''))
    && ['contact', 'newsletter'].includes(String(data.kind))
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || ''))
    && data.consent === true
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get('Origin') || ''
    const allowed = allowedOrigins.has(origin) || /https:\/\/[a-z0-9-]+\.navi-training\.pages\.dev/.test(origin)
    if (!allowed) return response({ ok: false, error: 'origin_not_allowed' }, 'https://navi.training', 403)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
    if (request.method !== 'POST') return response({ ok: false, error: 'method_not_allowed' }, origin, 405)
    const body = await request.json().catch(() => null)
    if (!validSubmission(body)) return response({ ok: false, error: 'invalid_fields' }, origin, 422)
    const enriched = {
      ...body,
      ip: request.headers.get('CF-Connecting-IP') || '',
      userAgent: request.headers.get('User-Agent') || '',
      queuedAt: new Date().toISOString(),
    }
    await env.LEAD_QUEUE.send(enriched, { contentType: 'json' })
    return response({ ok: true, queued: true, submissionId: body.submissionId }, origin, 202)
  },

  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const upstream = await fetch(env.PAYLOAD_LEAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: 'https://navi.training' },
          body: JSON.stringify(message.body),
        })
        if (upstream.ok) {
          message.ack()
        } else if (upstream.status === 429 || upstream.status >= 500) {
          message.retry({ delaySeconds: Math.min(30 * (2 ** message.attempts), 900) })
        } else {
          console.error('Permanent lead rejection', message.body.submissionId, upstream.status, await upstream.text())
          message.ack()
        }
      } catch (error) {
        console.error('Transient lead delivery failure', message.body.submissionId, error)
        message.retry({ delaySeconds: Math.min(30 * (2 ** message.attempts), 900) })
      }
    }
  },
} satisfies ExportedHandler<Env, LeadSubmission>
