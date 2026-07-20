// ComposeFab — speed-dial compose button (à la old Twitter / Google Drive).
//
//   single tap  → fan out the five post types; pick one to open the composer
//                 preset to that type (/compose?type=Article)
//   double tap  → skip the menu, open the composer at the default type
//   tap a pill / the backdrop / the FAB again → collapse
//
// The composer already reads ?type= (see app/compose.js), so picking a type is
// just a navigation. Degrades to a plain compose button if you never expand it.

import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { POST_TYPE_NAMES, POST_TYPES } from "../../lib/postTypes.js";
import { PostTypeIcon } from "../posts/PostTypeIcon.jsx";

// TODO: make this the user's configurable default post type once that setting
// exists; Note is the sensible fallback for now.
const DEFAULT_TYPE = "Note";
const DOUBLE_TAP_MS = 280;

const SHADOW = {
  elevation: 5,
  shadowColor: "#000",
  shadowOpacity: 0.16,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
};

export function ComposeFab() {
  const [open, setOpen] = useState(false);
  const lastTap = useRef(0);

  function openComposer(type) {
    setOpen(false);
    router.push(type ? `/compose?type=${type}` : "/compose");
  }

  function onFabPress() {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      openComposer(DEFAULT_TYPE); // double tap → default, skip the menu
      return;
    }
    lastTap.current = now;
    setOpen((o) => !o);
  }

  // Note nearest the FAB (bottom of the stack), Event at the top.
  const items = [...POST_TYPE_NAMES].reverse();

  return (
    <>
      {open ? (
        <Pressable
          onPress={() => setOpen(false)}
          className="absolute inset-0 bg-black/30"
        />
      ) : null}

      <View
        className="absolute items-end"
        style={{ bottom: 24, right: 20 }}
        pointerEvents="box-none"
      >
        {open ? (
          <View className="items-end mb-3" style={{ gap: 10 }}>
            {items.map((t) => (
              <Pressable
                key={t}
                onPress={() => openComposer(t)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                className="flex-row items-center bg-base-100 border border-base-300 px-4 py-2.5"
                style={SHADOW}
              >
                <PostTypeIcon type={t} size={18} />
                <Text className="font-ui uppercase tracking-[0.14em] text-xs text-base-content ml-2.5">
                  {POST_TYPES[t]?.label || t}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={onFabPress}
          className="w-14 h-14 bg-primary items-center justify-center"
          android_ripple={{ color: "rgba(255,255,255,0.15)" }}
          style={SHADOW}
        >
          <Text className="text-primary-content text-3xl leading-none mt-[-2px]">
            {open ? "×" : "+"}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
