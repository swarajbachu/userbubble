import { LegendList } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserbubble } from "@userbubble/react-native";
import { Link, Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

function PostCard(props: {
  post: RouterOutputs["post"]["all"][number];
  onDelete: () => void;
}) {
  return (
    <View className="flex flex-row rounded-lg bg-muted p-4">
      <View className="grow">
        <Link
          asChild
          href={{
            pathname: "/post/[id]",
            params: { id: props.post.id },
          }}
        >
          <Pressable className="">
            <Text className="font-semibold text-primary text-xl">
              {props.post.title}
            </Text>
            <Text className="mt-2 text-foreground">{props.post.content}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="font-bold text-primary uppercase">Delete</Text>
      </Pressable>
    </View>
  );
}

function CreatePost() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutate, error } = useMutation(
    trpc.post.create.mutationOptions({
      async onSuccess() {
        setTitle("");
        setContent("");
        await queryClient.invalidateQueries(trpc.post.all.queryFilter());
      },
    })
  );

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-foreground text-lg leading-tight"
        onChangeText={setTitle}
        placeholder="Title"
        value={title}
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.title}
        </Text>
      )}
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-foreground text-lg leading-tight"
        onChangeText={setContent}
        placeholder="Content"
        value={content}
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.content}
        </Text>
      )}
      <Pressable
        className="flex items-center rounded-sm bg-primary p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="text-foreground">Create</Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="mt-2 text-destructive">
          You need to be logged in to create a post
        </Text>
      )}
    </View>
  );
}

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

  const handleIdentify = async () => {
    try {
      await identify({
        id: `test_user_${Date.now()}`,
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
          <Pressable
            className="flex items-center rounded-sm bg-primary p-2"
            onPress={handleOpenFeedback}
          >
            <Text className="text-foreground">Open Feedback</Text>
          </Pressable>
          <Pressable
            className="flex items-center rounded-sm bg-destructive p-2"
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
  const queryClient = useQueryClient();

  const postQuery = useQuery(trpc.post.all.queryOptions());

  const deletePostMutation = useMutation(
    trpc.post.delete.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries(trpc.post.all.queryFilter()),
    })
  );

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

        <View className="py-2">
          <Text className="font-semibold text-primary italic">
            Press on a post
          </Text>
        </View>

        <LegendList
          data={postQuery.data ?? []}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          keyExtractor={(item) => item.id}
          renderItem={(p) => (
            <PostCard
              onDelete={() => deletePostMutation.mutate(p.item.id)}
              post={p.item}
            />
          )}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
}
