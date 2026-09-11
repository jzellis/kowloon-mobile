// Create an account directly via the admin API, skipping registration
// (invite codes, open/closed registration).
//
// Two things this has to get right that a plain form wouldn't:
//  - the username is a handle — it becomes @user@domain and the actor URL —
//    so it's validated as a slug here rather than letting the server 400;
//  - when no password is supplied the server generates one and returns it
//    exactly ONCE. Losing it strands the new account, so the result screen
//    holds it until dismissed and offers a copy button.

import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Copy } from "lucide-react-native";

import { AppHeader } from "../../../src/components/nav/AppHeader.jsx";
import { Button } from "../../../src/components/ui/Button.jsx";
import { Field } from "../../../src/components/ui/Field.jsx";
import { useActiveClient } from "../../../src/lib/useActiveClient.js";
import { useInk } from "../../../src/lib/useInk.js";

// expo-clipboard needs a native module; guard so a stripped build won't crash
// (same pattern as app/admin/invites.js). The password is on screen to read
// either way, so a no-op fallback only costs the convenience of one tap.
let Clipboard;
try {
  Clipboard = require("expo-clipboard");
} catch {
  Clipboard = { setStringAsync: async () => {} };
}

const USERNAME_RE = /^[a-z0-9_]{2,32}$/;

export default function NewAdminUser() {
  const router = useRouter();
  const client = useActiveClient();
  const ink = useInk();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const badUsername = username.length > 0 && !USERNAME_RE.test(username);
  const badPassword = password.length > 0 && password.length < 8;
  const canSubmit =
    username.length > 0 && !badUsername && !badPassword && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await client.admin.createUser({
        username,
        name: name || undefined,
        email: email || undefined,
        password: password || undefined,
      });
      setCreated(res);
    } catch (e) {
      setError(e?.message || "Couldn't create the user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPassword() {
    await Clipboard.setStringAsync(created.generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setUsername("");
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  if (created) {
    return (
      <SafeAreaView
        className="flex-1 bg-base-100"
        edges={["left", "right", "bottom"]}
      >
        <AppHeader back title="User created" />
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text className="font-ui text-base text-base-content mb-5">
            {created.user?.id} is ready to use.
          </Text>

          {created.generatedPassword ? (
            <View className="border-2 border-primary bg-base-200 p-4 mb-5">
              <Text className="font-ui uppercase tracking-[0.22em] text-[11px] text-base-content/70 mb-2">
                Generated password
              </Text>
              <View className="flex-row items-center">
                <Text className="flex-1 font-mono text-base text-base-content">
                  {created.generatedPassword}
                </Text>
                <Pressable
                  onPress={copyPassword}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Copy password"
                  className="pl-3"
                >
                  {copied ? (
                    <Check size={18} color={ink(0.55)} strokeWidth={1.75} />
                  ) : (
                    <Copy size={18} color={ink(0.55)} strokeWidth={1.75} />
                  )}
                </Pressable>
              </View>
              <Text className="font-ui text-xs text-base-content/50 mt-3">
                Shown once, and never recoverable — copy it now and give it to
                them. They can change it in Settings.
              </Text>
            </View>
          ) : (
            <Text className="font-ui text-xs text-base-content/50 mb-5">
              They can sign in with the password you set.
            </Text>
          )}

          <Button label="Create another" variant="secondary" onPress={reset} />
          <View className="h-3" />
          <Button label="Done" onPress={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-base-100"
      edges={["left", "right", "bottom"]}
    >
      <AppHeader back title="New User" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="jane_doe"
            autoCapitalize="none"
            error={
              badUsername
                ? "2–32 characters, lowercase letters, numbers or underscores only."
                : undefined
            }
            hint={
              badUsername
                ? undefined
                : "Becomes their handle and can't be changed later."
            }
          />

          <Field
            label="Display name"
            value={name}
            onChangeText={setName}
            placeholder="Jane Doe"
            autoCapitalize="words"
          />

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Leave blank to generate one"
            autoCapitalize="none"
            error={badPassword ? "At least 8 characters." : undefined}
            hint={
              badPassword
                ? undefined
                : "Leave blank and a strong one is generated for you."
            }
          />
        </ScrollView>

        {/* Sticky footer — always visible above keyboard */}
        <View className="px-6 pt-3 pb-2 bg-base-100">
          {error ? (
            <Text className="font-ui text-sm text-error mb-3">{error}</Text>
          ) : null}
          <Pressable
            onPress={canSubmit ? submit : undefined}
            disabled={!canSubmit}
            className="bg-primary items-center justify-center h-12 mb-3"
            android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            {submitting ? (
              <ActivityIndicator color="#FAF4E8" />
            ) : (
              <Text className="font-ui uppercase tracking-[0.14em] text-sm text-primary-content">
                Create User
              </Text>
            )}
          </Pressable>
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
