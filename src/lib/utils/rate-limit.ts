const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
};

export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetIn: number } {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (record.count >= maxRequests) {
    const resetIn = record.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

const AUTH_CONFIG: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
const OTP_CONFIG: RateLimitConfig = { windowMs: 5 * 60 * 1000, maxRequests: 5 };
const CHECKOUT_CONFIG: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 5 };

export function rateLimitAuth(request: Request) {
  const ip = getClientIp(request);
  return checkRateLimit(`auth:${ip}`, AUTH_CONFIG);
}

export function rateLimitOtp(request: Request, identifier: string) {
  const ip = getClientIp(request);
  return checkRateLimit(`otp:${ip}:${identifier}`, OTP_CONFIG);
}

export function rateLimitCheckout(request: Request) {
  const ip = getClientIp(request);
  return checkRateLimit(`checkout:${ip}`, CHECKOUT_CONFIG);
}

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}
