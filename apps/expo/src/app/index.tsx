import { useUserbubble } from "@userbubble/react-native";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

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

function HomeScreen() {
  const { logout, user } = useUserbubble();

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Welcome, {user?.name || user?.email}
      </Text>
      <Pressable
        onPress={() => router.push("/feedback")}
        style={{
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
          Give Feedback
        </Text>
      </Pressable>
      <Pressable
        onPress={logout}
        style={{
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#888", fontSize: 14 }}>Logout</Text>
      </Pressable>
    </View>
  );
}

export default function Index() {
  const { isIdentified } = useUserbubble();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Userbubble Demo" }} />
      {isIdentified ? <HomeScreen /> : <IdentifyForm />}
    </View>
  );
}
