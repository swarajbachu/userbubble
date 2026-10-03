import { QueryClientProvider } from "@tanstack/react-query";
import { UserbubbleProvider } from "@userbubble/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { queryClient } from "~/utils/api";
import { getBaseUrl } from "~/utils/base-url";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <UserbubbleProvider
      config={{
        apiKey: process.env.EXPO_PUBLIC_USERBUBBLE_API_KEY ?? "",
        baseUrl: getBaseUrl(),
        debug: process.env.NODE_ENV !== "production",
      }}
    >
      <QueryClientProvider client={queryClient}>
        {/*
          The Stack component displays the current page.
          It also allows you to configure your screens
        */}
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#c03484",
            },
            contentStyle: {
              backgroundColor: colorScheme === "dark" ? "#09090B" : "#FFFFFF",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="feedback"
            options={{
              presentation: "formSheet",
              headerShown: false,
              sheetGrabberVisible: true,
              sheetCornerRadius: 16,
            }}
          />
        </Stack>
        <StatusBar />
      </QueryClientProvider>
    </UserbubbleProvider>
  );
}
