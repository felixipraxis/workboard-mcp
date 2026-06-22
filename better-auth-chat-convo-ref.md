 I need to search for MCP, Generic OAuth, SSO, and hooks documentation to understand how you can build this custom gated flow. Let me look these up. Let me get more details on the OAuth Provider plugin and Generic OAuth plugin: Based on your requirements - **Entra SSO first, then token verification for downstream service before completing OAuth** - here's how you can build this with Better Auth using a combination of the OAuth Provider, SSO Plugin, and custom hooks:

## Architecture Overview

1. **SSO Plugin** - Handles Entra (Microsoft) OIDC authentication
2. **OAuth Provider Plugin** - Handles the MCP OAuth 2.1 flow  
3. **Custom Post-Login Step** - Gated token collection before consent

## Implementation

### 1. Configure OAuth Provider with Custom Post-Login Screen

The OAuth Provider Plugin has a `postLogin` configuration that lets you add custom steps between login and consent. This is where you'll collect and verify the downstream token:

```ts
import { betterAuth } from "better-auth";
import { sso } from "@better-auth/sso";
import { oauthProvider } from "@better-auth/oauth-provider";
import { jwt } from "better-auth/plugins";

const auth = betterAuth({
  plugins: [
    // SSO for Entra authentication
    sso({
      provisionUser: async ({ user, userInfo, token, provider }) => {
        // Store SSO tokens if needed
      }
    }),
    // JWT required for OAuth Provider
    jwt(),
    // OAuth Provider with custom post-login gate
    oauthProvider({
      loginPage: "/oauth/login",
      consentPage: "/oauth/consent",
      
      // This is your gate - runs after Entra SSO, before consent
      postLogin: {
        page: "/oauth/token-verification", // Your custom token input page
        shouldRedirect: async ({ session, scopes, headers }) => {
          // Check if user has already verified downstream token
          const hasDownstreamToken = await checkDownstreamToken(session.user.id);
          return !hasDownstreamToken; // Redirect to token page if missing
        },
        consentReferenceId: ({ session, scopes }) => {
          // Can attach metadata about the verified token to the consent
          return session.user.id;
        }
      }
    })
  ]
});
```

### 2. Create the Token Verification Page

Your `/oauth/token-verification` page collects the downstream token and verifies it before allowing the flow to continue:

```ts
// app/oauth/token-verification/page.tsx (or your framework equivalent)
import { authClient } from "@/lib/auth-client";

export default function TokenVerificationPage() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const downstreamToken = formData.get("token") as string;

    // Verify token with your downstream service
    const isValid = await verifyDownstreamToken(downstreamToken);
    
    if (!isValid) {
      // Show error, don't proceed
      return;
    }

    // Store the verified token (e.g., in your database)
    await storeDownstreamToken(downstreamToken);

    // Continue the OAuth flow
    await authClient.oauth2.oauth2Continue({ 
      postLogin: true 
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Authorize Downstream Service</h1>
      <p>Please provide your service token to complete authorization:</p>
      <input 
        type="password" 
        name="token" 
        required 
        placeholder="Enter your service token"
      />
      <button type="submit">Verify & Continue</button>
    </form>
  );
}
```

### 3. Complete the Flow with Consent

After the token verification, the user reaches the consent page as normal:

```ts
// app/oauth/consent/page.tsx
import { authClient } from "@/lib/auth-client";

export default function ConsentPage() {
  const handleConsent = async (accept: boolean) => {
    await authClient.oauth2.consent({ 
      accept,
      // scopes can be filtered based on token verification if needed
    });
  };

  return (
    <div>
      <h1>Authorize MCP Client</h1>
      <p>The MCP client is requesting access to your account.</p>
      <button onClick={() => handleConsent(true)}>Allow</button>
      <button onClick={() => handleConsent(false)}>Deny</button>
    </div>
  );
}
```

### 4. Add Custom Claims (Optional)

Include the downstream token info in the access token claims for your MCP server to use:

```ts
oauthProvider({
  // ... other config
  
  customAccessTokenClaims: ({ user, scopes, referenceId }) => {
    // Add downstream service context to the token
    return {
      "https://your-app.com/downstream-token-verified": true,
      "https://your-app.com/user-id": referenceId,
    };
  }
})
```

## Key Points

1. **OAuth 2.1 Compliant**: This uses the official OAuth Provider Plugin with MCP support, not the deprecated MCP Plugin.

2. **Gated Flow**: The `postLogin.shouldRedirect` condition creates your gate. It checks if the downstream token exists; if not, redirects to the token collection page.

3. **Session Persistence**: The token verification happens **after** the user is authenticated with Entra SSO, so you have a valid session. You can use custom session claims or your own database to track verified tokens.

4. **MCP Compatible**: The OAuth Provider Plugin outputs standard OAuth 2.1/OIDC which is MCP-compatible.

## Alternative: Using Hooks for Token Enforcement

If you need more control, you could alternatively use an `after` hook on the OAuth callback:

```ts
export const auth = betterAuth({
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // After Entra SSO callback
      if (ctx.path === "/sso/callback/entra") {
        // Check if downstream token exists
        const hasToken = await checkDownstreamToken(ctx.context.newSession?.user.id);
        
        if (!hasToken) {
          // Redirect to token collection, preserving OAuth state
          throw ctx.redirect(`/oauth/token-verification?oauth_query=${ctx.query.oauth_query}`);
        }
      }
    }),
  },
});
```

Both approaches ensure your users must authenticate with Entra SSO first, then provide a downstream service token before the OAuth flow completes and tokens are issued to the MCP client.

Let me look up database and security best practices for this setup:Let me get more details on secrets and encryption:Based on the documentation, here's my recommended secure database architecture for your gated MCP server with Entra SSO + downstream token verification:

## Database Recommendation: **PostgreSQL + Redis**

### Primary Database: PostgreSQL

**Why PostgreSQL:**
- Full ACID compliance for sensitive auth data
- Native support for JSON fields (useful for OAuth metadata)
- Row-level security capabilities
- Best support for Better Auth's advanced features (joins, complex queries)

```ts
// auth.ts
import { betterAuth } from "better-auth";
import { postgres } from "better-auth/adapters/postgres";

export const auth = betterAuth({
  database: postgres({
    connectionString: process.env.DATABASE_URL,
  }),
  // ...
});
```

### Secondary Storage: Redis

Use Redis for **sessions, rate limiting, and verification records** to reduce database load:

```ts
import { betterAuth } from "better-auth";
import { Redis } from "ioredis";
import { redisStorage } from "@better-auth/redis-storage";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD, // Enable AUTH
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // TLS in production
});

export const auth = betterAuth({
  secondaryStorage: redisStorage({
    client: redis,
    keyPrefix: "mcp-auth:",
  }),
  // ...
});
```

## Secure Storage Architecture

### 1. Built-in OAuth Token Encryption

Enable encryption for OAuth tokens stored in the `account` table (Entra tokens):

```ts
export const auth = betterAuth({
  account: {
    encryptOAuthTokens: true, // Encrypts accessToken, refreshToken, idToken
    storeStateStrategy: "database", // Store OAuth state securely
  },
  // ...
});
```

### 2. Custom Table for Downstream Service Tokens

Create a separate table for downstream service tokens with **application-level encryption**:

```ts
// Database schema (add via migration)
const downstreamTokenSchema = {
  id: "string",           // UUID
  userId: "string",       // Foreign key to user
  providerId: "string",   // e.g., "downstream-service-a"
  token: "string",        // ENCRYPTED token value
  tokenHash: "string",    // SHA-256 hash for lookup/verification
  expiresAt: "Date",      // Token expiration
  lastVerifiedAt: "Date", // Last successful verification
  createdAt: "Date",
  updatedAt: "Date",
};
```

**Store tokens encrypted** using your own encryption before saving:

```ts
// lib/token-storage.ts
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ENCRYPTION_KEY = createHash("sha256")
  .update(process.env.DOWNSTREAM_TOKEN_SECRET!)
  .digest(); // 32 bytes

const IV_LENGTH = 16;

export function encryptToken(token: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Hash for lookup without decryption
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
```

### 3. Integration with Post-Login Flow

```ts
// In your token verification page
const handleSubmit = async (downstreamToken: string) => {
  // 1. Verify token with downstream service
  const isValid = await verifyDownstreamToken(downstreamToken);
  if (!isValid) throw new Error("Invalid token");
  
  // 2. Encrypt before storage
  const encryptedToken = encryptToken(downstreamToken);
  const tokenHash = hashToken(downstreamToken);
  
  // 3. Store in database
  await db.downstreamTokens.create({
    userId: session.user.id,
    providerId: "downstream-service",
    token: encryptedToken,
    tokenHash, // For quick lookup/duplication check
    lastVerifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  
  // 4. Continue OAuth flow
  await authClient.oauth2.oauth2Continue({ postLogin: true });
};
```

## Security Configuration

### 1. Secret Management with Rotation Support

```ts
export const auth = betterAuth({
  // Primary secret for Better Auth
  secret: process.env.BETTER_AUTH_SECRET,
  
  // Versioned secrets for rotation (non-destructive)
  secrets: [
    { version: 2, value: process.env.BETTER_AUTH_SECRET_V2! },
    { version: 1, value: process.env.BETTER_AUTH_SECRET_V1! },
  ],
  
  // Separate secret for downstream tokens
  // (use process.env.DOWNSTREAM_TOKEN_SECRET in your encryption utils)
});
```

### 2. Enhanced Session Security

```ts
export const auth = betterAuth({
  session: {
    expiresIn: 3600,        // 1 hour for MCP use case
    updateAge: 300,         // Refresh every 5 minutes
    cookieCache: {
      enabled: true,
      maxAge: 60,           // 1 minute cache
    },
  },
  // ...
});
```

### 3. Rate Limiting with Redis

```ts
export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,                // Stricter for MCP auth
    storage: "secondary-storage", // Uses Redis
  },
});
```

## Complete Secure Configuration

```ts
export const auth = betterAuth({
  // Database
  database: postgres({ connectionString: process.env.DATABASE_URL }),
  secondaryStorage: redisStorage({ client: redis, keyPrefix: "mcp:" }),
  
  // Security
  secret: process.env.BETTER_AUTH_SECRET,
  secrets: process.env.BETTER_AUTH_SECRETS?.split(",").map((s, i) => ({
    version: i + 1,
    value: s,
  })),
  
  account: {
    encryptOAuthTokens: true,        // Entra tokens encrypted
    storeStateStrategy: "database",
  },
  
  session: {
    expiresIn: 3600,                 // Short-lived for MCP
    updateAge: 300,
  },
  
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
  },
  
  // OAuth Provider with gated post-login
  plugins: [
    sso({ /* Entra config */ }),
    jwt(),
    oauthProvider({
      loginPage: "/oauth/login",
      consentPage: "/oauth/consent",
      postLogin: {
        page: "/oauth/token-verification",
        shouldRedirect: async ({ session }) => {
          const hasToken = await db.downstreamTokens.findFirst({
            where: { userId: session.user.id, expiresAt: { gt: new Date() } },
          });
          return !hasToken;
        },
      },
    }),
  ],
});
```

## Key Security Principles

1. **Encrypt at Rest**: OAuth tokens (via `encryptOAuthTokens: true`) and downstream tokens (via your custom encryption)

2. **Hash for Lookup**: Store SHA-256 hashes of downstream tokens for deduplication/checks without decrypting

3. **Separate Secrets**: Use different secrets for Better Auth vs downstream token encryption

4. **Short TTL**: Sessions expire in 1 hour (MCP use case), downstream tokens refreshed/verified periodically

5. **Redis for Ephemeral Data**: Sessions, rate limits, verification codes in Redis; persistent data in PostgreSQL

6. **Audit Trail**: Log token verifications (not the tokens themselves) for compliance

This setup ensures that even if your database is compromised, the downstream service tokens remain encrypted and unusable without the encryption key.