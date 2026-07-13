// Typography settings — Kindle-style curated reading controls.
//
// Live preview at the top reflects every change instantly. Below it: a
// horizontal typeface picker and three segmented controls (size, line
// spacing, margins). No save button — changes apply immediately and sync to
// the server debounced, via TypographyContext.

import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../src/components/ui/Button.jsx";
import { Eyebrow, Heading } from "../../src/components/ui/Heading.jsx";
import { AppHeader } from "../../src/components/nav/AppHeader.jsx";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl.jsx";
import { useTypography } from "../../src/lib/TypographyContext.js";
import {
  FONTS,
  FONT_SIZE_ORDER,
  LINE_SPACING_ORDER,
  COLUMN_WIDTH_ORDER,
  fontName,
} from "../../src/lib/typography.js";

const SIZE_OPTIONS = FONT_SIZE_ORDER.map((v) => ({
  value: v,
  label: v.toUpperCase(),
}));
const SPACING_OPTIONS = LINE_SPACING_ORDER.map((v) => ({
  value: v,
  label: v,
}));
const MARGIN_OPTIONS = COLUMN_WIDTH_ORDER.map((v) => ({
  value: v,
  label: v,
}));

// Sample text — reads like an actual Kowloon post, and exercises bold +
// italic so the preview shows all three variants of the chosen face.
const PREVIEW_LEAD =
  "The city was never built to hold this many stories. Every circle you draw pulls another voice into the light — ";
const PREVIEW_ITALIC = "a neighbour, a stranger, a friend you haven't met yet.";
const PREVIEW_MID = " What you read here, you chose. ";
const PREVIEW_BOLD =
  "Nothing is sorted by a machine that profits from your attention.";

export default function TypographySettings() {
  const router = useRouter();
  const { typography, resolved, setTypography, flushTypography } =
    useTypography();

  function handleDone() {
    // Guarantee any debounced change is written before leaving.
    flushTypography();
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["left", "right", "bottom"]}>
      <AppHeader back title="Typography" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6">
          <Text className="font-ui text-base text-base-content/70 leading-6 mb-6">
            Tune how Kowloon reads. Changes follow your account across every
            device.
          </Text>
        </View>

        {/* Live preview */}
        <View className="px-6 mb-8">
          <Eyebrow className="mb-2">Preview</Eyebrow>
          <View className="border-2 border-base-300 bg-base-100 py-5">
            <Text
              style={{
                fontFamily: resolved.regularFamily,
                fontSize: resolved.fontSize,
                lineHeight: resolved.lineHeight,
                paddingHorizontal: resolved.paddingHorizontal,
                color: "#1A1A20",
              }}
            >
              {PREVIEW_LEAD}
              <Text style={{ fontFamily: resolved.italicFamily }}>
                {PREVIEW_ITALIC}
              </Text>
              {PREVIEW_MID}
              <Text style={{ fontFamily: resolved.boldFamily }}>
                {PREVIEW_BOLD}
              </Text>
            </Text>
          </View>
        </View>

        {/* Typeface picker */}
        <View className="mb-8">
          <Eyebrow className="px-6 mb-3">Typeface</Eyebrow>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {FONTS.map((font) => {
              const active = font.key === typography.fontFamily;
              return (
                <Pressable
                  key={font.key}
                  onPress={() => setTypography({ fontFamily: font.key })}
                  className={`mr-3 border-2 px-4 py-4 w-40 ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-base-300 bg-base-100"
                  }`}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                >
                  <Text
                    style={{ fontFamily: fontName(font.key, "regular") }}
                    className="text-xl text-base-content"
                  >
                    {font.label}
                  </Text>
                  <Text className="font-ui text-[10px] uppercase tracking-[0.16em] text-base-content/50 mt-2">
                    {font.classification}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Size */}
        <View className="px-6 mb-7">
          <Eyebrow className="mb-2">Size</Eyebrow>
          <SegmentedControl
            options={SIZE_OPTIONS}
            value={typography.fontSize}
            onChange={(v) => setTypography({ fontSize: v })}
          />
        </View>

        {/* Line spacing */}
        <View className="px-6 mb-7">
          <Eyebrow className="mb-2">Line spacing</Eyebrow>
          <SegmentedControl
            options={SPACING_OPTIONS}
            value={typography.lineSpacing}
            onChange={(v) => setTypography({ lineSpacing: v })}
          />
        </View>

        {/* Margins (columnWidth) */}
        <View className="px-6 mb-8">
          <Eyebrow className="mb-2">Margins</Eyebrow>
          <SegmentedControl
            options={MARGIN_OPTIONS}
            value={typography.columnWidth}
            onChange={(v) => setTypography({ columnWidth: v })}
          />
        </View>

        <View className="px-6">
          <Button label="Done" variant="ghost" onPress={handleDone} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
