import { QueryClientProvider } from "@tanstack/react-query";
import { UserbubbleProvider } from "@userbubble/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { queryClient } from "~/utils/api";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <UserbubbleProvider
      config={{
        apiKey:
          "ub_b57fec02c6e1f887b643fed84f0e7908adb62b1106ce12eb11cb1b284fe5a356",
        baseUrl: "http://192.168.0.101:3000", // IP address for mobile access
        useDirectUrls: true, // Use direct paths instead of subdomains for mobile
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
