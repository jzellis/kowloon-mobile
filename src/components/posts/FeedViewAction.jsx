// FeedViewAction — the contextual button shown next to the feed's view name.
//
// When you're reading a circle you don't own, it offers "Copy" (clone the
// circle into your own). When you're reading a group you haven't joined, it
// offers "Join" / "Request" — unless the group is invite-only, in which case
// there's nothing to offer. Owned circles / joined groups show nothing.

import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useSelector } from "react-redux";
import { LogIn } from "lucide-react-native";

import { useActiveClient } from "../../lib/useActiveClient.js";
import { canJoinGroup, joinNeedsApproval } from "../../lib/groups.js";
import { selectActiveAccount } from "../../state/accountsSlice.js";
import { CopyCircleMenu } from "../circles/CopyCircleMenu.jsx";

function isLocalToServer(userId, serverDomain) {
  if (!userId || !serverDomain) return false;
  return userId.endsWith(`@${serverDomain}`);
}

// `kind`, `subject`, `isOwner`, `isMember` come from useFeedSubject, resolved
// once by the parent (FeedHeader) so the selector label and this action share
// a single fetch.
export function FeedViewAction({ kind, subject, isOwner, isMember }) {
  if (!kind || !subject || isOwner) return null;

  if (kind === "circle") {
    return <CopyCircleMenu circle={subject} compact />;
  }

  // group
  if (isMember || !canJoinGroup(subject.rsvpPolicy)) return null;
  return <JoinGroupButton group={subject} />;
}

function JoinGroupButton({ group }) {
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const viewerIsLocal = isLocalToServer(account?.id, account?.server);
  const needsApproval = joinNeedsApproval(group?.rsvpPolicy, viewerIsLocal);

  async function handleJoin() {
    if (busy || done) return;
    setBusy(true);
    try {
      await client.activities.joinGroup({ groupId: group.id });
      setDone(true);
    } catch (e) {
      Alert.alert(
        needsApproval ? "Couldn't request to join" : "Couldn't join",
        e?.message || "Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const label = done
    ? needsApproval
      ? "Requested"
      : "Joined"
    : busy
      ? "…"
      : needsApproval
        ? "Request"
        : "Join";

  return (
    <Pressable
      onPress={handleJoin}
      disabled={busy || done}
      hitSlop={6}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      className={`flex-row items-center border-2 px-2 py-1 ${
        done ? "border-base-300" : "bg-primary border-primary"
      }`}
    >
      {done ? null : (
        <LogIn size={11} color="#FAF4E8" strokeWidth={1.75} />
      )}
      <Text
        className={`font-ui uppercase tracking-[0.12em] text-[10px] ${
          done ? "text-base-content/50 ml-0" : "text-primary-content ml-1"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
