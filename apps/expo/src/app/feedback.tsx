import { useUserbubble } from "@userbubble/react-native";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

function LoadingIndicator() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function FeedbackModal() {
  const { getEmbedUrl, isIdentified } = useUserbubble();
  const { height } = useWindowDimensions();
  const url = getEmbedUrl("/feedback");

  if (!(isIdentified && url)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Not identified</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 10, paddingHorizontal: 10 }}>
      <Stack.Screen
        options={{
          title: "Feedback",
          presentation: "formSheet",
        }}
      />
      <WebView
        domStorageEnabled
        javaScriptEnabled
        renderLoading={() => <LoadingIndicator />}
        source={{ uri: url }}
        startInLoadingState
        style={{ height }}
      />
    </View>
  );
}
