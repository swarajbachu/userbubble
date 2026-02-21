import { useUserbubble } from "@userbubble/react-native";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "~/utils/auth";

function MobileAuth() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <Text className="pb-2 text-center font-semibold text-foreground text-xl">
        {session?.user.name ? `Hello, ${session.user.name}` : "Not logged in"}
      </Text>
      <Pressable
        className="flex items-center rounded-sm bg-primary p-2"
        onPress={() =>
          session
            ? authClient.signOut()
            : authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              })
        }
      >
        <Text>{session ? "Sign Out" : "Sign In With Google"}</Text>
      </Pressable>
    </>
  );
}

function UserbubbleTest() {
  const { identify, isIdentified, user, openUserbubble, logout } =
    useUserbubble();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  console.log(isIdentified, "identify");

  const handleIdentify = async () => {
    try {
      await identify({
        id: "test_user_1",
        email: email || "test@example.com",
        name: name || "Test User",
      });
      Alert.alert("Success", "User identified successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to identify: ${error}`);
    }
  };

  const handleOpenFeedback = async () => {
    try {
      await openUserbubble("/feedback");
    } catch (error) {
      Alert.alert("Error", `Failed to open: ${error}`);
    }
  };

  return (
    <View className="mt-4 rounded-lg bg-muted p-4">
      <Text className="pb-2 font-bold text-foreground text-xl">
        Userbubble SDK Test
      </Text>

      {isIdentified ? (
        <View className="gap-2">
          <Text className="text-foreground">
            Identified as: {user?.email ?? "Unknown"}
          </Text>

          <Text className="mt-2 font-semibold text-foreground text-sm">
            Open Userbubble Pages:
          </Text>

          <Pressable
            className="flex items-center rounded-sm bg-primary p-2"
            onPress={handleOpenFeedback}
          >
            <Text className="text-foreground">📝 Feedback</Text>
          </Pressable>

          <Pressable
            className="flex items-center rounded-sm bg-primary p-2"
            onPress={async () => {
              try {
                await openUserbubble("/roadmap");
              } catch (error) {
                Alert.alert("Error", `Failed to open: ${error}`);
              }
            }}
          >
            <Text className="text-foreground">🗺️ Roadmap</Text>
          </Pressable>

          <Pressable
            className="flex items-center rounded-sm bg-primary p-2"
            onPress={async () => {
              try {
                await openUserbubble("/changelog");
              } catch (error) {
                Alert.alert("Error", `Failed to open: ${error}`);
              }
            }}
          >
            <Text className="text-foreground">📋 Changelog</Text>
          </Pressable>

          <Pressable
            className="mt-2 flex items-center rounded-sm bg-destructive p-2"
            onPress={logout}
          >
            <Text className="text-foreground">Logout</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-2">
          <TextInput
            className="rounded-md border border-input bg-background px-3 text-foreground text-lg"
            onChangeText={setEmail}
            placeholder="Email (optional)"
            value={email}
          />
          <TextInput
            className="rounded-md border border-input bg-background px-3 text-foreground text-lg"
            onChangeText={setName}
            placeholder="Name (optional)"
            value={name}
          />
          <Pressable
            className="flex items-center rounded-sm bg-primary p-2"
            onPress={handleIdentify}
          >
            <Text className="text-foreground">Identify User</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function Index() {
  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="h-full w-full bg-background p-4">
        <Text className="pb-2 text-center font-bold text-5xl text-foreground">
          Create <Text className="text-primary">T3</Text> Turbo
        </Text>

        <MobileAuth />

        <UserbubbleTest />
      </View>
    </SafeAreaView>
  );
}
