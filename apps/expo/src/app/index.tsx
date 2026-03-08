import { useUserbubble } from "@userbubble/react-native";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { WebView } from "react-native-webview";

function EmbedWebView() {
  const { getEmbedUrl, isIdentified, user, logout } = useUserbubble();
  const [path, setPath] = useState("/feedback");
  const url = getEmbedUrl(path);

  console.log("[expo] EmbedWebView render, url:", url);

  if (!(isIdentified && url)) {
    return <Text>Not identified</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}
      >
        <Text style={{ fontSize: 12 }}>{user?.email}</Text>
        <Pressable onPress={logout}>
          <Text style={{ fontSize: 12, color: "red" }}>Logout</Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}
      >
        {[
          { label: "Feedback", value: "/feedback" },
          { label: "Roadmap", value: "/roadmap" },
          { label: "Updates", value: "/changelog" },
        ].map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => setPath(tab.value)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: path === tab.value ? 2 : 0,
              borderBottomColor: "#3b82f6",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: path === tab.value ? "#000" : "#888",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <WebView
        domStorageEnabled
        javaScriptEnabled
        key={path}
        source={{ uri: url }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function IdentifyForm() {
  const { identify } = useUserbubble();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleIdentify = async () => {
    try {
      await identify({
        id: "test_user_1",
        email: email || "testuser@example.com",
        name: name || "Test User",
      });
    } catch (error) {
      Alert.alert("Error", `Failed to identify: ${error}`);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Sign in to leave feedback
      </Text>
      <TextInput
        onChangeText={setEmail}
        placeholder="Email"
        style={{
          borderWidth: 1,
          borderColor: "#d4d4d4",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
        }}
        value={email}
      />
      <TextInput
        onChangeText={setName}
        placeholder="Name"
        style={{
          borderWidth: 1,
          borderColor: "#d4d4d4",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
        }}
        value={name}
      />
      <Pressable
        onPress={handleIdentify}
        style={{
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

export default function Index() {
  const { isIdentified } = useUserbubble();

  console.log("[expo] isIdentified:", isIdentified);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Feedback" }} />
      {isIdentified ? <EmbedWebView /> : <IdentifyForm />}
    </View>
  );
}
