import { QueryClientProvider } from "@tanstack/react-query";
import { UserbubbleProvider } from "@userbubble/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { queryClient } from "~/utils/api";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <UserbubbleProvider
      config={{
        apiKey:
          "ub_260643bb545e3fb6240da601d03927b64b7b682698e5c3bde8363cd382e01f82", // Replace with actual API key
        baseUrl: "https://app.host.local", // Point to your local development server
        debug: true,
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
        />
        <StatusBar />
      </QueryClientProvider>
    </UserbubbleProvider>
  );
}
