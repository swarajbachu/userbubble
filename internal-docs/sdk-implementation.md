# critichut SDK Implementation Guide

> **Technical specification for building the JavaScript SDK**

**Last Updated:** 2025-11-08
**Status:** Implementation Ready
**Target Size:** < 10KB gzipped

---

## Table of Contents

1. [SDK Architecture](#sdk-architecture)
2. [Core API](#core-api)
3. [Link Enhancement](#link-enhancement)
4. [Token Management](#token-management)
5. [Auto-Authentication](#auto-authentication)
6. [Error Handling](#error-handling)
7. [TypeScript Definitions](#typescript-definitions)
8. [Build & Distribution](#build--distribution)

---

## SDK Architecture

### Package Structure

```
packages/sdk/
├── src/
│   ├── index.ts              # Main SDK class
│   ├── types.ts              # TypeScript definitions
│   ├── token.ts              # Token encoding/decoding
│   ├── link-enhancer.ts      # Link auto-enhancement
│   ├── auth.ts               # Authentication logic
│   └── utils.ts              # Helper functions
├── dist/
│   ├── sdk.js                # Compiled output
│   ├── sdk.min.js            # Minified
│   └── sdk.d.ts              # Type definitions
├── package.json
├── tsconfig.json
└── rollup.config.js          # Build configuration
```

### Design Principles

1. **Zero dependencies** - No external libraries
2. **Browser-only** - No Node.js dependencies
3. **Tiny footprint** - < 10KB gzipped
4. **Type-safe** - Full TypeScript support
5. **Safari-compatible** - No third-party cookies

---

## Core API

### Main SDK Class

```typescript
// packages/sdk/src/index.ts

import { critichutUser, critichutConfig } from './types';
import { encodeToken, decodeToken } from './token';
import { enhanceLinks } from './link-enhancer';
import { authenticate } from './auth';

class critichutSDK {
  private orgSlug: string | null = null;
  private user: critichutUser | null = null;
  private config: critichutConfig = {};
  private initialized = false;

  /**
   * Initialize critichut SDK
   * @param orgSlug - Organization slug (e.g., "acme")
   * @param config - Configuration options
   */
  init(orgSlug: string, config?: critichutConfig): void {
    if (this.initialized) {
      console.warn('[critichut] Already initialized');
      return;
    }

    this.orgSlug = orgSlug;
    this.config = config || {};
    this.initialized = true;

    // If user provided, identify them
    if (config?.user) {
      this.identify(config.user);
    }

    console.log(`[critichut] Initialized for org: ${orgSlug}`);
  }

  /**
   * Identify a user
   * @param user - User identity with HMAC signature
   */
  identify(user: critichutUser): void {
    if (!this.orgSlug) {
      throw new Error('[critichut] Must call init() before identify()');
    }

    // Validate user data
    if (!user.id || !user.email || !user.signature) {
      throw new Error('[critichut] User must have id, email, and signature');
    }

    this.user = user;

    // Store identity in localStorage
    const identityData = {
      orgSlug: this.orgSlug,
      user: user,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('critichut:identity', JSON.stringify(identityData));
      console.log('[critichut] User identified:', user.email);
    } catch (error) {
      console.error('[critichut] Failed to store identity:', error);
    }

    // Auto-enhance all links on page
    enhanceLinks(this.orgSlug);
  }

  /**
   * Clear stored identity
   */
  logout(): void {
    this.user = null;
    localStorage.removeItem('critichut:identity');
    console.log('[critichut] User logged out');
  }

  /**
   * Get current user (if identified)
   */
  getUser(): critichutUser | null {
    return this.user;
  }

  /**
   * Check if user is identified
   */
  isIdentified(): boolean {
    return this.user !== null;
  }

  /**
   * Manually trigger link enhancement
   * Useful for dynamically added links
   */
  refreshLinks(): void {
    if (this.orgSlug) {
      enhanceLinks(this.orgSlug);
    }
  }
}

// Create global instance
const sdk = new critichutSDK();

// Export to window
if (typeof window !== 'undefined') {
  window.critichut = sdk;

  // Emit ready event
  window.dispatchEvent(new Event('critichut:ready'));

  // Auto-authenticate if on critichut domain
  if (window.location.hostname.includes('critichut.com')) {
    authenticate();
  }
}

export default sdk;
```

---

## Link Enhancement

### Auto-Enhance Links

```typescript
// packages/sdk/src/link-enhancer.ts

/**
 * Automatically enhance all critichut links with auth tokens
 */
export function enhanceLinks(orgSlug: string): void {
  // Find all links to this org's subdomain
  const selector = `a[href*="${orgSlug}.critichut.com"]`;
  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  console.log(`[critichut] Enhancing ${links.length} links`);

  links.forEach(link => {
    // Skip if already enhanced
    if (link.dataset.critichutEnhanced === 'true') {
      return;
    }

    // Mark as enhanced
    link.dataset.critichutEnhanced = 'true';

    // Add click handler
    link.addEventListener('click', handleLinkClick);
  });
}

/**
 * Handle click on critichut link
 */
function handleLinkClick(e: MouseEvent): void {
  e.preventDefault();

  const link = e.currentTarget as HTMLAnchorElement;
  const targetUrl = link.href;

  // Get stored identity
  const identityDataStr = localStorage.getItem('critichut:identity');

  if (!identityDataStr) {
    // No identity, navigate normally
    window.location.href = targetUrl;
    return;
  }

  try {
    const identityData = JSON.parse(identityDataStr);

    // Check if identity is still fresh (within 24 hours)
    const age = Date.now() - identityData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      console.warn('[critichut] Identity expired, navigating without auth');
      window.location.href = targetUrl;
      return;
    }

    // Generate auth token
    const token = generateAuthToken(identityData);

    // Append to URL
    const url = new URL(targetUrl);
    url.searchParams.set('auth', token);

    // Navigate with auth token
    window.location.href = url.toString();
  } catch (error) {
    console.error('[critichut] Link enhancement failed:', error);
    window.location.href = targetUrl;
  }
}

/**
 * Generate URL-safe auth token
 */
function generateAuthToken(identityData: any): string {
  // Encode as URL-safe base64
  const json = JSON.stringify(identityData);
  const base64 = btoa(json);

  // Make URL-safe
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

### Dynamic Link Handling

```typescript
// For SPAs with dynamically added links
window.critichut.refreshLinks();

// Or use MutationObserver for automatic detection
export function setupLinkObserver(orgSlug: string): void {
  const observer = new MutationObserver((mutations) => {
    let shouldRefresh = false;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          const hasLinks = node.querySelectorAll(`a[href*="${orgSlug}.critichut.com"]`).length > 0;
          if (hasLinks) {
            shouldRefresh = true;
          }
        }
      });
    });

    if (shouldRefresh) {
      enhanceLinks(orgSlug);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
```

---

## Token Management

### Token Encoding

```typescript
// packages/sdk/src/token.ts

export interface TokenData {
  orgSlug: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    signature: string;
  };
  timestamp: number;
}

/**
 * Encode identity data as URL-safe token
 */
export function encodeToken(data: TokenData): string {
  const json = JSON.stringify(data);
  const base64 = btoa(json);

  // Convert to URL-safe base64
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode URL-safe token to identity data
 */
export function decodeToken(token: string): TokenData {
  // Convert from URL-safe base64
  const base64 = token
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Decode
  const json = atob(base64);
  return JSON.parse(json);
}

/**
 * Validate token freshness
 */
export function isTokenValid(data: TokenData, maxAge: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const age = Math.abs(now - data.timestamp);
  return age < maxAge;
}
```

---

## Auto-Authentication

### Client-Side Authentication

```typescript
// packages/sdk/src/auth.ts

/**
 * Auto-authenticate on critichut subdomain
 * Called automatically when page loads on critichut.com
 */
export async function authenticate(): Promise<boolean> {
  // Check if already authenticated
  const hasSession = await checkSession();
  if (hasSession) {
    console.log('[critichut] Already authenticated');
    return true;
  }

  // Check for auth token in URL
  const params = new URLSearchParams(window.location.search);
  const authToken = params.get('auth');

  if (!authToken) {
    console.log('[critichut] No auth token found');
    return false;
  }

  try {
    // Decode token
    const identityData = decodeToken(authToken);

    // Validate timestamp (5-minute window)
    if (!isTokenValid(identityData)) {
      console.error('[critichut] Token expired');
      cleanupUrl();
      return false;
    }

    // Call backend to authenticate
    const response = await fetch('/api/auth/external-login/sign-in', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalId: identityData.user.id,
        email: identityData.user.email,
        name: identityData.user.name,
        avatar: identityData.user.avatar,
        timestamp: identityData.timestamp,
        organizationSlug: identityData.orgSlug,
        signature: identityData.user.signature,
      }),
    });

    if (response.ok) {
      console.log('[critichut] Authentication successful');
      cleanupUrl();
      window.location.reload();
      return true;
    } else {
      console.error('[critichut] Authentication failed');
      cleanupUrl();
      return false;
    }
  } catch (error) {
    console.error('[critichut] Authentication error:', error);
    cleanupUrl();
    return false;
  }
}

/**
 * Check if user has active session
 */
async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Remove auth token from URL
 */
function cleanupUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  window.history.replaceState({}, '', url.toString());
}
```

---

## Error Handling

### Graceful Degradation

```typescript
// packages/sdk/src/utils.ts

/**
 * Safe localStorage access (handles quota exceeded, disabled, etc.)
 */
export function safeLocalStorage() {
  return {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('[critichut] localStorage.getItem failed:', error);
        return null;
      }
    },

    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('[critichut] localStorage.setItem failed:', error);
      }
    },

    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('[critichut] localStorage.removeItem failed:', error);
      }
    },
  };
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('Retry failed');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

### User-Friendly Error Messages

```typescript
// Error display utility
export function showError(message: string): void {
  // Create error banner
  const banner = document.createElement('div');
  banner.className = 'critichut-error';
  banner.textContent = message;
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    font-family: sans-serif;
    font-size: 14px;
  `;

  document.body.appendChild(banner);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    banner.remove();
  }, 5000);
}
```

---

## TypeScript Definitions

```typescript
// packages/sdk/src/types.ts

/**
 * User identity with HMAC signature
 */
export interface critichutUser {
  /** Unique user ID from customer's system */
  id: string;

  /** User's email address */
  email: string;

  /** User's display name */
  name?: string;

  /** URL to user's avatar image */
  avatar?: string;

  /** HMAC signature (generated by customer's backend) */
  signature: string;
}

/**
 * SDK configuration options
 */
export interface critichutConfig {
  /** User to identify (optional, can call identify() later) */
  user?: critichutUser;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom authentication endpoint (for testing) */
  authEndpoint?: string;
}

/**
 * Global critichut SDK instance
 */
export interface critichutSDK {
  /**
   * Initialize SDK with organization slug
   */
  init(orgSlug: string, config?: critichutConfig): void;

  /**
   * Identify current user
   */
  identify(user: critichutUser): void;

  /**
   * Clear stored identity
   */
  logout(): void;

  /**
   * Get current identified user
   */
  getUser(): critichutUser | null;

  /**
   * Check if user is identified
   */
  isIdentified(): boolean;

  /**
   * Refresh link enhancement (for dynamic content)
   */
  refreshLinks(): void;
}

/**
 * Global window interface
 */
declare global {
  interface Window {
    critichut: critichutSDK;
  }
}
```

---

## Build & Distribution

### Rollup Configuration

```javascript
// packages/sdk/rollup.config.js

import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  // UMD build (for <script> tags)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/sdk.js',
      format: 'umd',
      name: 'critichut',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },

  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/sdk.min.js',
      format: 'umd',
      name: 'critichut',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      }),
    ],
  },

  // ESM build (for bundlers)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/sdk.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
];
```

### Package.json

```json
{
  "name": "@critichut/sdk",
  "version": "1.0.0",
  "description": "critichut JavaScript SDK for auto-login",
  "main": "dist/sdk.js",
  "module": "dist/sdk.esm.js",
  "types": "dist/sdk.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "critichut",
    "feedback",
    "authentication",
    "sdk"
  ],
  "license": "MIT",
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-terser": "^0.4.4",
    "@rollup/plugin-typescript": "^11.1.6",
    "rollup": "^4.9.6",
    "typescript": "^5.3.3"
  }
}
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext",
    "lib": ["ES2015", "DOM"],
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## CDN Deployment

### Vercel Edge Functions

```typescript
// apps/cdn/api/sdk.ts

import { readFileSync } from 'fs';
import { join } from 'path';

export const config = {
  runtime: 'edge',
};

export default function handler(req: Request) {
  const url = new URL(req.url);
  const version = url.searchParams.get('v') || 'latest';

  // Serve SDK from dist
  const sdkPath = join(process.cwd(), 'packages/sdk/dist/sdk.min.js');
  const sdk = readFileSync(sdkPath, 'utf-8');

  return new Response(sdk, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

### Cloudflare Workers

```typescript
// CDN worker for cdn.critichut.com/sdk.js

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Serve SDK
    if (url.pathname === '/sdk.js') {
      const sdk = await fetch('https://github.com/critichut/sdk/releases/latest/download/sdk.min.js');

      return new Response(await sdk.text(), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

---

## Usage Examples

### Basic Usage

```html
<script src="https://cdn.critichut.com/sdk.js"></script>
<script>
  window.addEventListener('critichut:ready', async () => {
    const { user, signature } = await fetch('/api/critichut/signature').then(r => r.json());

    critichut.init('acme', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        signature: signature,
      }
    });
  });
</script>
```

### React Integration

```typescript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.critichut.com/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    const handleReady = async () => {
      const { user, signature } = await fetch('/api/critichut/signature').then(r => r.json());

      window.critichut.init('acme', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          signature: signature,
        }
      });
    };

    window.addEventListener('critichut:ready', handleReady);

    return () => {
      window.removeEventListener('critichut:ready', handleReady);
    };
  }, []);

  return (
    <a href="https://acme.critichut.com/feedback">
      Submit Feedback
    </a>
  );
}
```

### Next.js App Router

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script src="https://cdn.critichut.com/sdk.js" />
        <Script id="critichut-init">
          {`
            window.addEventListener('critichut:ready', async () => {
              const res = await fetch('/api/critichut/signature');
              const data = await res.json();
              critichut.init('acme', { user: data });
            });
          `}
        </Script>
      </body>
    </html>
  );
}
```

---

## Testing

### Unit Tests

```typescript
// packages/sdk/src/__tests__/token.test.ts

import { describe, it, expect } from 'vitest';
import { encodeToken, decodeToken, isTokenValid } from '../token';

describe('Token encoding/decoding', () => {
  it('should encode and decode token', () => {
    const data = {
      orgSlug: 'acme',
      user: {
        id: 'user_123',
        email: 'john@example.com',
        signature: 'abc123',
      },
      timestamp: Date.now(),
    };

    const token = encodeToken(data);
    const decoded = decodeToken(token);

    expect(decoded).toEqual(data);
  });

  it('should validate token freshness', () => {
    const fresh = {
      orgSlug: 'acme',
      user: { id: '1', email: 'test@test.com', signature: 'sig' },
      timestamp: Date.now(),
    };

    const stale = {
      orgSlug: 'acme',
      user: { id: '1', email: 'test@test.com', signature: 'sig' },
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    };

    expect(isTokenValid(fresh, 5 * 60 * 1000)).toBe(true);
    expect(isTokenValid(stale, 5 * 60 * 1000)).toBe(false);
  });
});
```

### Integration Tests

```typescript
// packages/sdk/src/__tests__/integration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Link enhancement', () => {
  beforeEach(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <a href="https://acme.critichut.com/feedback">Feedback</a>
        </body>
      </html>
    `);

    global.window = dom.window as any;
    global.document = dom.window.document;
  });

  it('should enhance links with auth tokens', () => {
    // Test implementation
  });
});
```

---

## Performance Optimization

### Bundle Size Analysis

```bash
# Check bundle size
npm run build
npx bundlesize

# Target: < 10KB gzipped
```

### Tree Shaking

```typescript
// Only export what's needed
export { critichutSDK } from './sdk';

// Avoid exporting everything
// export * from './utils'; ❌
```

### Code Splitting

```typescript
// Lazy load auth module only on critichut subdomain
if (window.location.hostname.includes('critichut.com')) {
  import('./auth').then(({ authenticate }) => {
    authenticate();
  });
}
```

---

**End of Document**
