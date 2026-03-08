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
          "ub_1a713a7ae1e5acc234840545ec2ebf7885a0da9488276b784e51cb9340f3db2a",
        baseUrl: "https://app.gesturs.com",
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
