// Best-effort por instancia serverless (sin dependencias, sin Redis/BD propia).
// Suficiente para <100 pedidos/mes; si algún día hay abuso real,
// migrar a Vercel WAF o Upstash (tiene capa gratuita). Ver SECURITY.md §4.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
	const now = Date.now();
	const entry = hits.get(ip);
	if (!entry || now > entry.reset) {
		hits.set(ip, { count: 1, reset: now + windowMs });
		return true;
	}
	entry.count++;
	return entry.count <= limit; // false → responder 429 / rechazar
}
