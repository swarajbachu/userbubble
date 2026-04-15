# @userbubble/react-native

Userbubble SDK for React Native and Expo applications. Embed your feedback portal directly in your app using a WebView.

## Installation

### Expo

```bash
npx expo install @userbubble/react-native expo-secure-store react-native-webview
```

### Bare React Native

```bash
npm install @userbubble/react-native @react-native-async-storage/async-storage react-native-webview
```

## Quick Start

```typescript
import { UserbubbleProvider, useUserbubble } from "@userbubble/react-native";
import { WebView } from "react-native-webview";

// 1. Wrap your app with UserbubbleProvider
export default function App() {
  return (
    <UserbubbleProvider
      config={{
        apiKey: process.env.EXPO_PUBLIC_USERBUBBLE_API_KEY!,
      }}
    >
      <MyApp />
    </UserbubbleProvider>
  );
}

// 2. Identify users and embed the portal
function MyApp() {
  const { identify, getEmbedUrl, isIdentified } = useUserbubble();
  const url = getEmbedUrl("/feedback");

  if (isIdentified && url) {
    return <WebView source={{ uri: url }} style={{ flex: 1 }} />;
  }

  // Show your login screen, then call identify() after login
  return <LoginScreen onLogin={(user) => identify(user)} />;
}
```

## Documentation

For full documentation, examples, and API reference, visit [docs.userbubble.com/docs/sdks/react-native](https://docs.userbubble.com/docs/sdks/react-native).

## License

MIT
