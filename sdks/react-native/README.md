# @userbubble/react-native

Userbubble SDK for React Native and Expo applications. Simple user identification with seamless integration.

## Installation

### Expo

```bash
npx expo install @userbubble/react-native expo-secure-store
```

### Bare React Native

```bash
npm install @userbubble/react-native @react-native-async-storage/async-storage
```

## Quick Start

```typescript
import { UserbubbleProvider, useUserbubble } from "@userbubble/react-native";
import { Button } from "react-native";

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

// 2. Use the hook in your components
function MyApp() {
  const { identify, openUserbubble, isIdentified } = useUserbubble();

  const handleLogin = async () => {
    // After user logs in to your app
    await identify({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  };

  return (
    <>
      {!isIdentified && <Button title="Login" onPress={handleLogin} />}
      {isIdentified && (
        <Button
          title="Give Feedback"
          onPress={() => openUserbubble("/feedback")}
        />
      )}
    </>
  );
}
```

## Configuration

```typescript
type UserbubbleConfig = {
  apiKey: string;                    // Your organization's API key (required)
  baseUrl?: string;                  // Default: "https://app.userbubble.com"
  debug?: boolean;                   // Enable debug logging
  storageType?: "expo" | "async-storage" | "auto";  // Default: "auto"
  customStorage?: StorageAdapter;    // Custom storage implementation
};
```

## API Reference

### `useUserbubble()`

Hook to access Userbubble SDK methods.

```typescript
const {
  user,              // Current identified user
  isInitialized,     // Whether SDK is initialized
  isIdentified,      // Whether user is identified
  identify,          // Identify a user
  logout,            // Logout current user
  getUser,           // Get current user
  openUserbubble,    // Open Userbubble with authentication
} = useUserbubble();
```

### `identify(user)`

Identify a user with Userbubble.

```typescript
await identify({
  id: "user_123",
  email: "user@example.com",
  name: "John Doe",
  avatar: "https://example.com/avatar.jpg",
});
```

### `openUserbubble(path?)`

Open Userbubble in browser with authentication.

```typescript
await openUserbubble();              // Open home
await openUserbubble("/feedback");   // Open feedback page
```

### `logout()`

Logout the current user.

```typescript
await logout();
```

## Documentation

For complete documentation, visit [docs.userbubble.com](https://docs.userbubble.com)

## License

MIT
