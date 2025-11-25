# Rate Limiting Implementation

## Overview
Rate limiting has been implemented to protect against brute force attacks, spam, and DoS attempts.

## Configuration

All rate limits are configured in `src/lib/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
    // Login attempts: 5 attempts per 15 minutes per IP/email
    LOGIN: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
    },

    // Public form submissions: 10 per hour per IP
    FORM_SUBMISSION: {
        limit: 10,
        windowMs: 60 * 60 * 1000,
    },

    // API calls: 100 per minute per user
    API: {
        limit: 100,
        windowMs: 60 * 1000,
    },

    // Password reset: 3 attempts per hour per email
    PASSWORD_RESET: {
        limit: 3,
        windowMs: 60 * 60 * 1000,
    },
};
```

## Protected Endpoints

### 1. Login (`/login`)
- **Limit**: 5 attempts per 15 minutes
- **Identifiers**: IP address + email address
- **Implementation**: `src/lib/auth-actions.ts`
- **Behavior**:
  - Limits by IP to prevent distributed attacks
  - Limits by email to prevent targeted account attacks
  - Resets counters on successful login
  - Returns user-friendly error messages with retry time

**Error Messages:**
- "Muitas tentativas de login. Tente novamente em X segundos."
- "Muitas tentativas para este email. Tente novamente em X segundos."

### 2. Form Submissions (`/f/[slug]`)
- **Limit**: 10 submissions per hour per IP
- **Additional Limit**: 5 submissions per hour per form per IP
- **Implementation**: `src/lib/form-actions.ts`
- **Behavior**:
  - Global limit prevents spam across all forms
  - Per-form limit prevents targeting specific forms
  - Protects tenant data from bulk submissions

**Error Messages:**
- "Muitas submissões. Tente novamente em X segundos."
- "Muitas submissões para este formulário. Tente novamente em X segundos."

## Implementation Details

### Algorithm
Uses a **sliding window** approach:
- Tracks individual request timestamps
- Removes expired requests from the window
- More accurate than fixed windows
- Prevents request bursts at window boundaries

### Storage
Current implementation uses **in-memory storage**:
- ✅ Fast and simple
- ✅ No external dependencies
- ✅ Automatic cleanup every 5 minutes
- ⚠️ Data lost on server restart
- ⚠️ Not suitable for multi-instance deployments

### Client Identification
IP address is extracted from headers in priority order:
1. `x-forwarded-for` (proxy/load balancer)
2. `x-real-ip` (nginx)
3. `cf-connecting-ip` (Cloudflare)
4. Fallback to "unknown"

## Production Considerations

### For Production with Multiple Instances
Replace in-memory storage with Redis/Upstash:

```typescript
// Example with Upstash
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});
```

### Environment Variables
For production, configure via environment:

```env
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW=900000
RATE_LIMIT_FORM_MAX=10
RATE_LIMIT_FORM_WINDOW=3600000
```

### Monitoring
Monitor rate limit stats:

```typescript
import { rateLimiter } from '@/lib/rate-limiter';

// Get current stats
const stats = rateLimiter.getStats();
console.log(stats); // { totalKeys: 42, totalRequests: 128 }
```

### Manual Reset
Reset rate limit for specific users:

```typescript
// Reset login attempts for an IP
rateLimiter.reset('login:ip:192.168.1.1');

// Reset form submissions for an IP
rateLimiter.reset('form:ip:192.168.1.1');
```

## Testing

### Test Rate Limiting
```bash
# Test login rate limit (6th attempt should fail)
for i in {1..6}; do
  curl -X POST http://localhost:3000/login \
    -d "email=test@example.com" \
    -d "password=wrong"
done

# Test form submission rate limit
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/forms/submit \
    -H "Content-Type: application/json" \
    -d '{"formId": "123", "data": {}}'
done
```

## Security Best Practices

1. **Use HTTPS**: Prevents header manipulation
2. **Trust Proxy Headers**: Configure correctly in production
3. **Monitor Logs**: Track rate limit violations
4. **Adjust Limits**: Based on legitimate usage patterns
5. **Add Captcha**: For persistent attackers (after N violations)

## Future Enhancements

- [ ] Add Captcha after multiple violations
- [ ] Implement distributed rate limiting (Redis)
- [ ] Add rate limiting to API routes
- [ ] Track and block repeat offenders
- [ ] Email notifications for abuse detection
- [ ] Dashboard for rate limit monitoring

## Related Files

- `src/lib/rate-limiter.ts` - Core implementation
- `src/lib/auth-actions.ts` - Login protection
- `src/lib/form-actions.ts` - Form submission protection
- `src/lib/auth-helpers.ts` - Authentication helpers
