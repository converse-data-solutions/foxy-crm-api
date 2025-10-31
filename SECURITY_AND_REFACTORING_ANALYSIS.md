# Security & Refactoring Analysis - Foxy CRM API

**Analysis Date:** 2025-10-23
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. **SENSITIVE CREDENTIALS EXPOSED IN REPOSITORY** 🔴
**Location:** `.env` file (root directory)
**Issue:** Environment file contains:
- Database credentials (DB_USER, DB_PASS)
- JWT secret keys (ACCESS_SECRET_KEY, REFRESH_SECRETE_KEY)
- Stripe API keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- SMTP credentials (SMTP_USER, SMTP_PASS)

**Risk:** Complete system compromise if repository is public or leaked

**Fix:**
```bash
# Immediately:
git rm --cached .env
git commit -m "Remove .env from tracking"
git push

# Add to .gitignore (already present but file was committed before)
# Rotate ALL secrets immediately:
# - Generate new JWT secrets
# - Rotate Stripe keys
# - Change database password
# - Update SMTP credentials
```

### 2. **Insecure Cookie Configuration** 🔴
**Location:** `src/shared/utils/cookie.util.ts:16`
**Issue:**
```typescript
secure: false,  // Cookies sent over HTTP
sameSite: 'lax', // Vulnerable to CSRF
```

**Risk:**
- Man-in-the-middle attacks
- Token theft over unencrypted connections
- CSRF attacks possible

**Fix:**
```typescript
const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'prod', // HTTPS only in production
  maxAge: 1000 * 60 * 60 * 24,
  path: '/',
  sameSite: 'strict', // Prevent CSRF
};
```

### 3. **SQL Injection Vulnerability** 🔴
**Location:** `src/services/user.service.ts:97-108`
**Issue:**
```typescript
if (['name', 'email', 'phone', 'city', 'country'].includes(key)) {
  qb.andWhere(`user.${key} LIKE :${key}`, { [key]: `%${value}%` });
}
```

**Risk:** Column name is dynamically constructed from user input. While parameterized, the column name itself could be exploited.

**Fix:**
```typescript
// Whitelist approach
const ALLOWED_SEARCH_COLUMNS = ['name', 'email', 'phone', 'city', 'country'] as const;

if (ALLOWED_SEARCH_COLUMNS.includes(key as any)) {
  const column = key as typeof ALLOWED_SEARCH_COLUMNS[number];
  qb.andWhere(`user.${column} LIKE :${column}`, { [column]: `%${value}%` });
}
```

**Similar issues in:**
- `src/services/lead.service.ts:97-107`
- All other services using dynamic query building

### 4. **Missing CSRF Protection** 🔴
**Location:** Cookie-based authentication without CSRF tokens
**Issue:** Application uses cookie-based JWT auth but no CSRF protection

**Risk:** Cross-Site Request Forgery attacks

**Fix:**
```bash
npm install csurf cookie-parser
```
```typescript
// main.ts
import * as csurf from 'csurf';
app.use(csurf({ cookie: true }));
```

### 5. **Plaintext OTP Storage** 🔴
**Location:**
- `src/database/entities/base-app-entities/tenant.entity.ts:63`
- `src/services/otp.service.ts:53`

**Issue:** OTPs stored as plaintext integers in database

**Risk:** Database breach exposes all active OTPs

**Fix:**
```typescript
// Hash OTPs before storage
const hashedOtp = await bcrypt.hash(otp.toString(), 10);
user.otp = hashedOtp;

// Verify with bcrypt.compare()
const isValid = await bcrypt.compare(otpDto.otp.toString(), user.otp);
```

### 6. **JWT Validation Bypass** 🔴
**Location:** `src/services/token.service.ts:33-53`
**Issue:** JWT validation doesn't check:
- User account status (active/disabled)
- User email verification status
- Token invalidation/blacklisting

**Risk:** Deleted or disabled users can still authenticate

**Fix:**
```typescript
async verifyAccessToken(token: string, isSocketValidation?: boolean): Promise<JwtPayload> {
  const payload: JwtPayload = this.jwtService.verify(token, {
    secret: JWT_CONFIG.ACCESS_SECRET_KEY,
  });

  const tenant = await this.tenantService.getTenant(payload.email);
  const userRepo = await getRepo(User, tenant.schemaName);
  const user = await userRepo.findOne({ where: { email: payload.email } });

  if (!user) throw new UnauthorizedException('Invalid token');
  if (!user.status) throw new UnauthorizedException('Account disabled');
  if (!user.emailVerified) throw new UnauthorizedException('Email not verified');

  return payload;
}
```

### 7. **Stripe Webhook Error Handling** 🔴
**Location:** `src/controllers/stripe-payment.controller.ts:46-48`
**Issue:**
```typescript
} catch (err) {
  console.error('Stripe webhook processing error:', err);
}
res.status(HttpStatus.OK).send({ received: true }); // Always returns 200
```

**Risk:**
- Failed payments marked as successful
- Stripe will not retry webhooks
- Revenue loss

**Fix:**
```typescript
} catch (err) {
  this.logger.error('Stripe webhook processing error:', err);
  return res.status(HttpStatus.BAD_REQUEST).json({
    error: 'Webhook processing failed'
  });
}
```

---

## 🟠 HIGH PRIORITY SECURITY ISSUES

### 8. **Race Condition in Connection Pool** 🟠
**Location:** `src/shared/database-connection/get-connection.ts:24-33`
**Issue:**
```typescript
if (connections[schemaName]?.initializing) {
  await connections[schemaName].initializing;
  // Race: Another request could initialize between check and await
}
```

**Risk:** Multiple connections created for same tenant

**Fix:**
```typescript
// Use mutex/semaphore pattern
private static initializationLocks = new Map<string, Promise<DataSource>>();

if (this.initializationLocks.has(schemaName)) {
  return await this.initializationLocks.get(schemaName)!;
}

const initPromise = this.initializeConnection(schemaName);
this.initializationLocks.set(schemaName, initPromise);
```

### 9. **Connection Pool Memory Leak** 🟠
**Location:** `src/shared/database-connection/get-connection.ts:84-87`
**Issue:**
```typescript
if (Object.keys(connections).length === 0 && cleanupInterval) {
  clearInterval(cleanupInterval);
  cleanupInterval = null;
}
```

**Risk:** If connections never reach 0, interval runs forever

**Fix:** Add explicit cleanup on app shutdown:
```typescript
// In module/main.ts
app.enableShutdownHooks();

@Injectable()
export class ConnectionCleanupService implements OnModuleDestroy {
  async onModuleDestroy() {
    await closeAllConnections();
  }
}
```

### 10. **Missing Rate Limiting on Critical Endpoints** 🟠
**Location:** `src/controllers/auth.controller.ts`
**Issue:**
- Token refresh endpoint has no rate limit
- OTP send endpoints not throttled
- Login endpoint uses global throttler (10 req/60s too permissive)

**Fix:**
```typescript
@SkipThrottle(false)
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
@Post('signin')
async userSignin(@Body() user: SignIn) { ... }

@Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 OTPs per 5 minutes
@Post('verify-email/send-otp')
async sendOtp(@Body() payload: EmailDto) { ... }
```

### 11. **File Upload Vulnerabilities** 🟠
**Location:** `src/services/lead.service.ts:165-217`
**Issues:**
- No file size limit
- No MIME type validation
- CSV parsing without sanitization
- No virus scanning

**Fix:**
```typescript
// In file-validation.pipe.ts
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['text/csv', 'application/csv'];

if (file.size > MAX_FILE_SIZE) {
  throw new BadRequestException('File too large');
}
if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}
```

### 12. **Tenant Schema Creation Not Atomic** 🟠
**Location:** `src/services/tenant.service.ts:34-60`
**Issue:** Schema creation, migration, and user creation not in transaction

**Risk:** Partial tenant setup on failure

**Fix:**
```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await queryRunner.query(`SET search_path TO "${schema}"`);
  await dataSource.runMigrations();
  // ... user creation
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  await queryRunner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  throw error;
} finally {
  await queryRunner.release();
}
```

### 13. **WebSocket Authentication Bypass** 🟠
**Location:** `src/gateway/crm.gateway.ts:34-52`
**Issue:** WebSocket connections not validated against subscription status

**Risk:** Expired subscriptions can still connect

**Fix:**
```typescript
async handleConnection(client: Socket) {
  const payload = await this.tokenService.verifyAccessToken(token, true);
  const user = await this.userService.validateUser(payload, schema);

  // Add subscription check
  if (!user.subscription?.status) {
    client.emit('error', { message: 'Subscription expired' });
    client.disconnect(true);
    return;
  }
}
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 14. **Information Disclosure in Error Messages** 🟡
**Location:** Multiple locations
**Issue:** Detailed error messages reveal system internals

**Examples:**
- `'Invalid tenant-id.'` - reveals UUID validation
- `'Please provide work email address'` - reveals domain-based tenant isolation
- Database errors exposed to clients

**Fix:** Generic error messages in production, detailed in logs

### 15. **Missing Input Sanitization** 🟡
**Location:** All DTOs
**Issue:** No sanitization decorators on string inputs

**Fix:**
```typescript
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateLeadDto {
  @Transform(({ value }) => sanitizeHtml(value))
  name: string;
}
```

### 16. **OTP Reuse Vulnerability** 🟡
**Location:** `src/services/otp.service.ts:88-93`
**Issue:** Old OTPs not invalidated when new one is generated

**Fix:**
```typescript
// Clear old OTP when generating new one
async sendOtp(email: string) {
  // ... existing code
  existUser.otp = null; // Clear old OTP first
  existUser.otpVerified = false;
  const newOtp = generateOtp();
  existUser.otp = newOtp;
  // ...
}
```

### 17. **No Request ID Tracing** 🟡
**Issue:** No correlation ID for tracking requests across services

**Fix:**
```typescript
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});
```

---

## 🔧 CRITICAL REFACTORING NEEDS

### 18. **Console.log in Production Code**
**Locations:**
- `src/common/filter/custom-exception.filter.ts:19, 32`
- `src/controllers/stripe-payment.controller.ts:47`

**Fix:** Replace with proper logger:
```typescript
// Remove all console.log/error
// Use LoggerService instead
this.logger.error('Error details', { error, context: 'StripeWebhook' });
```

### 19. **Hardcoded Configuration**
**Issues:**
- CORS origin hardcoded to `localhost:3000` (main.ts:23)
- OTP expiry hardcoded to 1.5 minutes (otp.service.ts:52)
- Connection limits hardcoded (get-connection.ts:14)

**Fix:** Move to environment variables:
```typescript
// config.util.ts
export const APP_CONFIG = {
  corsOrigin: envVars.CORS_ORIGIN || 'http://localhost:3000',
  otpExpiryMinutes: Number(envVars.OTP_EXPIRY_MINUTES) || 5,
  maxTenantConnections: Number(envVars.MAX_TENANT_CONNECTIONS) || 50,
};
```

### 20. **Typo in Filename**
**Location:** `src/common/strategy/jwt.startegy.ts`
**Issue:** Should be `jwt.strategy.ts`

**Fix:** Rename file and update imports

### 21. **Missing Health Check Endpoint**
**Issue:** No way to monitor application health

**Fix:**
```typescript
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### 22. **Duplicate Code Across Services**
**Issue:** `getTenant(email)` pattern repeated in every service

**Fix:** Create a decorator or base service:
```typescript
@Injectable()
export class TenantContextService {
  async getSchemaFromEmail(email: string): Promise<string> {
    const tenant = await this.tenantService.getTenant(email);
    return tenant.schemaName;
  }
}
```

### 23. **Missing Transaction Management**
**Issue:** No transaction decorator for multi-step operations

**Fix:**
```typescript
import { DataSource } from 'typeorm';

async withTransaction<T>(
  dataSource: DataSource,
  operation: (queryRunner: QueryRunner) => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await operation(queryRunner);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 24. **Inconsistent Error Handling**
**Issue:** Some errors throw exceptions, others return error objects

**Fix:** Standardize on throwing HttpExceptions, let global filter handle

### 25. **No API Versioning Strategy**
**Issue:** API prefix is `api/v1` but no version handling

**Fix:**
```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// controllers
@Controller({ path: 'auth', version: '1' })
```

---

## 🧪 TESTING GAPS

### 26. **No Unit Tests**
**Issue:** No test files present in codebase

**Fix:** Add Jest tests:
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  describe('signin', () => {
    it('should reject invalid credentials', async () => {
      await expect(authService.signin(invalidCreds))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

### 27. **No Integration Tests**
**Issue:** Multi-tenant setup not tested

**Fix:** Add e2e tests for tenant isolation

### 28. **No Security Tests**
**Issue:** No penetration testing or security scans

**Fix:** Add:
- OWASP ZAP scanning
- SQL injection testing
- Authentication bypass testing

---

## 📊 MONITORING & OBSERVABILITY

### 29. **Missing Metrics**
**Issue:** No Prometheus/metrics endpoint

**Fix:**
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

### 30. **No Structured Logging**
**Issue:** Logs not in JSON format for parsing

**Fix:**
```typescript
// logger.service.ts
winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  // ...
});
```

### 31. **No APM Integration**
**Issue:** No application performance monitoring

**Fix:** Integrate DataDog, New Relic, or Sentry

---

## 🎯 IMMEDIATE ACTION ITEMS (Priority Order)

1. **REMOVE .env FROM GIT AND ROTATE ALL SECRETS** 🔴
2. **FIX COOKIE SECURITY FLAGS** 🔴
3. **ADD CSRF PROTECTION** 🔴
4. **FIX SQL INJECTION VULNERABILITIES** 🔴
5. **HASH OTPs BEFORE STORAGE** 🔴
6. **FIX STRIPE WEBHOOK ERROR HANDLING** 🔴
7. **ADD RATE LIMITING TO AUTH ENDPOINTS** 🟠
8. **FIX FILE UPLOAD VALIDATION** 🟠
9. **MAKE TENANT SETUP ATOMIC** 🟠
10. **REMOVE CONSOLE.LOG STATEMENTS** 🟡

---

## 📝 IMPLEMENTATION CHECKLIST

- [ ] Security audit completed
- [ ] Secrets rotated
- [ ] Cookie security fixed
- [ ] CSRF protection added
- [ ] SQL injection fixed
- [ ] OTP hashing implemented
- [ ] Rate limiting configured
- [ ] File upload validation added
- [ ] Transaction management added
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests added
- [ ] Security tests implemented
- [ ] Logging standardized
- [ ] Monitoring/metrics added
- [ ] Documentation updated

---

**END OF ANALYSIS**
