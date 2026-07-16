// FeedViewSelector — pick what you're reading.
//
// Choices: All Posts (merged public + server), one of the user's circles, or a
// joined group. The trigger is the current view's title; tapping opens a
// dropdown anchored directly below the trigger (not a bottom sheet).
//
// Returns the active feed view key:
//   "all"          — getServerPosts()  (merged public + server firehose)
//   "circle:<id>"  — getCirclePosts({ circleId })

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import { useActiveClient } from "../../lib/useActiveClient.js";
import { useJoinedGroups } from "../../lib/useJoinedGroups.js";
import { selectActiveAccount } from "../../state/accountsSlice.js";
import { ServerFeedIcon } from "./ServerFeedIcon.jsx";
import { HexAvatar } from "../ui/HexAvatar.jsx";
import { resolveImageUrl } from "../../lib/resolveImageUrl.js";

const DROPDOWN_WIDTH = 240;
const MAX_LIST_HEIGHT = 320;

export function FeedViewSelector({ value, onChange, subject }) {
  // `subject` (from useFeedSubject, via FeedHeader) is the resolved circle/group
  // behind `value` when it isn't one of your own — used so the trigger shows
  // its real name/icon instead of falling back to "Public".
  const subjectForValue = subject?.id === value ? subject : null;
  // Any key that isn't a circle/group is the merged "All Posts" view (covers
  // "all" plus legacy "public"/"server"/"" persisted values).
  const isSubjectView =
    typeof value === "string" &&
    (value.startsWith("circle:") || value.startsWith("group:"));
  const account = useSelector(selectActiveAccount);
  const client = useActiveClient();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [circles, setCircles] = useState([]);
  const [search, setSearch] = useState("");
  const { groups } = useJoinedGroups();
  const baseUrl = client?.http?.baseUrl;
  const [serverIcon, setServerIcon] = useState(null);

  const serverViews = useMemo(
    () => [
      {
        value: "all",
        label: "All Posts",
        summary: `Everything across the network and ${
          account?.serverName || account?.server || "this server"
        }.`,
      },
    ],
    [account?.serverName, account?.server]
  );

  useEffect(() => {
    if (!client || !account?.id) return;
    let cancelled = false;
    client.feeds
      .getUserCircles({ userId: account.id })
      .then((res) => {
        const items = res?.orderedItems || res?.items || [];
        if (!cancelled) {
          setCircles(
            items.filter((c) => c?.id && c?.name && c?.type !== "System")
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, account?.id]);

  // Server icon for the Public/Server overlay glyphs.
  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.feeds
      .getServerInfo()
      .then((info) => {
        if (!cancelled && info?.icon) {
          setServerIcon(resolveImageUrl(info.icon, baseUrl));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, baseUrl]);

  // Icon for the collapsed trigger: server overlay for Public/Server, the
  // circle's / group's hex avatar otherwise.
  function iconFor(value, size = 20) {
    const circle = circles.find((c) => c.id === value);
    if (circle) {
      return <HexAvatar uri={resolveImageUrl(circle.icon, baseUrl)} size={size} />;
    }
    const group = groups.find((g) => g.id === value);
    if (group) {
      return <HexAvatar uri={resolveImageUrl(group.icon, baseUrl)} size={size} />;
    }
    // Not one of your own — fall back to the resolved subject's hex avatar.
    if (subjectForValue) {
      return (
        <HexAvatar uri={resolveImageUrl(subjectForValue.icon, baseUrl)} size={size} />
      );
    }
    // "All Posts" — the server icon under a globe (the whole network mix).
    return <ServerFeedIcon iconUrl={serverIcon} variant="public" size={size} />;
  }

  const currentLabel =
    circles.find((c) => c.id === value)?.name ||
    groups.find((g) => g.id === value)?.name ||
    subjectForValue?.name ||
    "All Posts";

  function openDropdown() {
    // Refetch circles on every open so newly added circles appear immediately
    if (client && account?.id) {
      client.feeds
        .getUserCircles({ userId: account.id })
        .then((res) => {
          const items = res?.orderedItems || res?.items || [];
          setCircles(items.filter((c) => c?.id && c?.name && c?.type !== "System"));
        })
        .catch(() => {});
    }
    triggerRef.current?.measureInWindow((x, y, _w, h) => {
      setDropPos({ top: y + h, left: x });
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
    setSearch("");
  }

  function select(v) {
    onChange(v);
    close();
  }

  const showSearch = circles.length > 5;
  const filteredCircles = search.trim()
    ? circles.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : circles;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openDropdown}
        hitSlop={6}
        className="flex-row items-center"
      >
        <View className="mr-2">{iconFor(value, 20)}</View>
        <Text
          className="font-ui text-sm tracking-tight text-base-content mr-1"
          numberOfLines={1}
        >
          {currentLabel}
        </Text>
        <Text className="font-ui text-xs text-base-content/40">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        {/* Full-screen dismiss backdrop */}
        <Pressable className="flex-1" onPress={close}>
          {/* Stop propagation so tapping inside the dropdown doesn't close it */}
          <Pressable
            onPress={() => {}}
            style={{
              position: "absolute",
              top: dropPos.top,
              left: dropPos.left,
              width: DROPDOWN_WIDTH,
            }}
            className="bg-base-100 border-2 border-base-content"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: MAX_LIST_HEIGHT }}
              bounces={false}
            >
              {serverViews.map((v) => (
                <Row
                  key={v.value}
                  label={v.label}
                  summary={v.summary}
                  selected={!isSubjectView}
                  onPress={() => select(v.value)}
                  icon={
                    <ServerFeedIcon iconUrl={serverIcon} variant="public" size={22} />
                  }
                />
              ))}

              {circles.length > 0 ? (
                <View className="border-t-2 border-base-300 mt-1">
                  <Text className="font-ui uppercase tracking-[0.18em] text-[10px] text-base-content/40 px-4 pt-3 pb-1">
                    Your circles
                  </Text>
                  {showSearch ? (
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Search circles..."
                      placeholderTextColor="rgba(26,26,32,0.3)"
                      autoCorrect={false}
                      autoCapitalize="none"
                      className="font-ui text-xs text-base-content border-b border-base-300 mx-4 mb-1"
                      style={{ paddingVertical: 4 }}
                    />
                  ) : null}
                  {filteredCircles.map((c) => (
                    <Row
                      key={c.id}
                      label={c.name}
                      summary={c.summary}
                      selected={value === c.id}
                      onPress={() => select(c.id)}
                      icon={
                        <HexAvatar
                          uri={resolveImageUrl(c.icon, baseUrl)}
                          size={22}
                        />
                      }
                    />
                  ))}
                  {showSearch && filteredCircles.length === 0 ? (
                    <Text className="font-ui text-xs text-base-content/40 px-4 py-3">
                      No circles match
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {groups.length > 0 ? (
                <View className="border-t-2 border-base-300 mt-1">
                  <Text className="font-ui uppercase tracking-[0.18em] text-[10px] text-base-content/40 px-4 pt-3 pb-1">
                    Your groups
                  </Text>
                  {groups.map((g) => (
                    <Row
                      key={g.id}
                      label={g.name}
                      selected={value === g.id}
                      onPress={() => select(g.id)}
                      icon={
                        <HexAvatar
                          uri={resolveImageUrl(g.icon, baseUrl)}
                          size={22}
                        />
                      }
                    />
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Row({ label, summary, selected, onPress, icon }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      className={`flex-row items-center px-4 py-3 ${selected ? "bg-secondary" : ""}`}
    >
      {icon ? <View className="mr-3">{icon}</View> : null}
      <View className="flex-1 min-w-0">
        <Text
          className={`font-ui uppercase tracking-[0.14em] text-xs ${
            selected ? "text-secondary-content" : "text-base-content"
          }`}
        >
          {label}
        </Text>
        {summary ? (
          <Text
            className={`font-ui text-xs mt-0.5 ${
              selected ? "text-secondary-content/70" : "text-base-content/45"
            }`}
          >
            {summary}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
