# @userbubble/web

Userbubble feedback widget for any website. Renders a floating bubble button that opens a slide-out panel with your feedback portal — all in an isolated Shadow DOM.

Works with any website via script tag, or as an npm package with optional React bindings.

## Installation

### Script tag (any website)

```html
<script src="https://cdn.userbubble.com/userbubble.min.js"></script>
<script>
  Userbubble.init({ apiKey: 'ub_xxx' });
  Userbubble.identify({
    id: 'user_123',
    email: 'jane@example.com',
    name: 'Jane Doe',
  });
</script>
```

### npm

```bash
npm install @userbubble/web
```

```typescript
import { Userbubble } from '@userbubble/web';

Userbubble.init({
  apiKey: 'ub_xxx',
  position: 'bottom-right',
  theme: 'auto',
});

await Userbubble.identify({
  id: 'user_123',
  email: 'jane@example.com',
  name: 'Jane Doe',
});
```

### React

```tsx
import {
  UserbubbleProvider,
  UserbubbleWidget,
  useUserbubble,
} from '@userbubble/web/react';

function App() {
  return (
    <UserbubbleProvider config={{ apiKey: 'ub_xxx' }}>
      <MyApp />
      <UserbubbleWidget />
    </UserbubbleProvider>
  );
}

function MyApp() {
  const { identify, open, isIdentified } = useUserbubble();

  const handleLogin = async () => {
    await identify({
      id: 'user_123',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      {isIdentified && <button onClick={() => open()}>Open Feedback</button>}
    </div>
  );
}
```

## Configuration

Pass these options to `Userbubble.init()` or `<UserbubbleProvider config={...}>`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your organization API key (`ub_xxx`) |
| `baseUrl` | `string` | `https://app.userbubble.com` | Userbubble server URL |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Widget button position |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme. `auto` follows system preference |
| `accentColor` | `string` | `'#6366f1'` | Bubble button background color |
| `hideWidget` | `boolean` | `false` | Hide the floating button (open programmatically) |
| `useDirectUrls` | `boolean` | `false` | Use `/external/org/` paths instead of subdomains |
| `debug` | `boolean` | `false` | Enable console logging |

## API

### Vanilla JS

```typescript
Userbubble.init(config)         // Initialize the SDK and mount the widget
Userbubble.identify(user)       // Identify a user (returns Promise)
Userbubble.open(path?)          // Open the panel (default: '/feedback')
Userbubble.close()              // Close the panel
Userbubble.logout()             // Clear user data
Userbubble.destroy()            // Remove widget from DOM

// Read-only properties
Userbubble.isIdentified         // boolean
Userbubble.isOpen               // boolean
Userbubble.user                 // UserbubbleUser | null
```

### React hook

```typescript
const {
  identify,      // (user: UserbubbleUser) => Promise<void>
  open,          // (path?: string) => void
  close,         // () => void
  logout,        // () => void
  isIdentified,  // boolean
  isOpen,        // boolean
  isInitialized, // boolean
  user,          // UserbubbleUser | null
} = useUserbubble();
```

## Navigation

The widget panel has built-in tabs for Feedback, Roadmap, and Updates. You can also navigate programmatically:

```typescript
Userbubble.open('/feedback');   // Feedback tab
Userbubble.open('/roadmap');    // Roadmap tab
Userbubble.open('/changelog');  // Updates tab
```

## How it works

1. `init()` mounts a Shadow DOM element to the page with a floating bubble button
2. `identify()` calls `POST /api/identify` with your API key to register the user
3. When opened, an iframe loads your external feedback portal with user context as query params
4. The Shadow DOM ensures complete style isolation from the host page
5. User identity persists in localStorage across page reloads

## Local development

For local development, use `useDirectUrls` and point `baseUrl` at your dev server:

```typescript
Userbubble.init({
  apiKey: 'ub_xxx',
  baseUrl: 'http://localhost:3000',
  useDirectUrls: true,
  debug: true,
});
```

## Building

```bash
cd sdks/web
pnpm build       # Build all outputs
pnpm typecheck   # Type check
pnpm dev         # Watch mode
```

Build outputs:
- `dist/index.esm.js` — ES module
- `dist/index.js` — CommonJS
- `dist/userbubble.min.js` — UMD (for script tags)
- `dist/react.esm.js` — React ES module
- `dist/react.js` — React CommonJS
