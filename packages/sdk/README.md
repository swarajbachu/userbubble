# userbubble JavaScript SDK

Seamless user identification and authentication for the userbubble feedback platform.

## Features

- 🔐 **HMAC-based authentication** - Secure, server-side signature verification
- 🍪 **Safari compatible** - Works with Safari's ITP and third-party cookie blocking
- 🔗 **Auto-login links** - Automatically enhance userbubble links with auth tokens
- 📦 **Tiny footprint** - < 10KB gzipped
- 🎯 **Zero dependencies** - Pure JavaScript, no external libraries
- 📘 **TypeScript support** - Full type definitions included

## Installation

### Via CDN (Recommended)

```html
<script src="https://cdn.userbubble.com/sdk/latest/sdk.min.js"></script>
<script>
  userbubble.init('your-org-slug', {
    user: {
      id: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
      signature: 'generated-server-side',
      timestamp: Date.now()
    }
  });
</script>
```

### Via NPM

```bash
npm install @userbubble/sdk
```

```javascript
import userbubble from '@userbubble/sdk';

userbubble.init('your-org-slug', {
  user: {
    id: 'user123',
    email: 'user@example.com',
    name: 'John Doe',
    signature: 'generated-server-side',
    timestamp: Date.now()
  }
});
```

## Usage

### 1. Generate HMAC Signature (Server-side)

The HMAC signature must be generated on your backend using your organization's secret key:

```javascript
// Node.js example
const crypto = require('crypto');

function createSignature(user, orgSlug, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = [
    user.id,
    user.email,
    user.name || '',
    timestamp.toString(),
    orgSlug
  ].join('|');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  return { signature, timestamp };
}
```

### 2. Initialize SDK (Client-side)

```javascript
// Initialize SDK with your organization slug
userbubble.init('your-org-slug', {
  baseUrl: 'https://app.userbubble.com', // Optional
  autoLogin: true, // Optional, default: true
  debug: false // Optional, default: false
});

// Identify the current user
userbubble.identify({
  id: 'user123',
  email: 'user@example.com',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  signature: signatureFromServer,
  timestamp: timestampFromServer
});
```

### 3. Auto-Login on Link Clicks

Once a user is identified, all userbubble links will automatically include authentication:

```html
<!-- Before -->
<a href="https://app.userbubble.com/feedback">Give Feedback</a>

<!-- After click, automatically becomes -->
<!-- https://app.userbubble.com/feedback?auth_token=eyJ... -->
<!-- Token is immediately removed after authentication -->
```

## API Reference

### `init(orgSlug, config?)`

Initialize the SDK.

**Parameters:**
- `orgSlug` (string): Your organization slug
- `config` (object, optional):
  - `user`: User to identify immediately
  - `baseUrl`: userbubble base URL (default: `https://app.userbubble.com`)
  - `autoLogin`: Enable auto-login on link clicks (default: `true`)
  - `linkSelector`: CSS selector for links to enhance (default: `a[href*='userbubble.com']`)
  - `debug`: Enable debug logging (default: `false`)

### `identify(user)`

Identify a user.

**Parameters:**
- `user` (object):
  - `id` (string): Unique user ID from your system
  - `email` (string): User email
  - `name` (string, optional): User display name
  - `avatar` (string, optional): User avatar URL
  - `signature` (string): HMAC signature (generated server-side)
  - `timestamp` (number): Unix timestamp when signature was created

### `logout()`

Logout the current user.

### `getUser()`

Get the current identified user.

**Returns:** `userbubbleUser | null`

### `isIdentified()`

Check if a user is currently identified.

**Returns:** `boolean`

### `getOrgSlug()`

Get the organization slug.

**Returns:** `string | null`

## Security

- **Never expose your secret key** in client-side code
- Always generate HMAC signatures on your backend
- Signatures are valid for 5 minutes by default
- Use HTTPS in production

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (including ITP)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

```bash
# Install dependencies
pnpm install

# Build SDK
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck
```

## License

MIT
