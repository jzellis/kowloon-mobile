// PostTypeDropdown — "Add New [type]" trigger + positional dropdown for the
// compose screen title bar. Replaces the horizontal icon strip.

import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { POST_TYPE_NAMES, POST_TYPES } from "../../lib/postTypes.js";
import { PostTypeIcon } from "./PostTypeIcon.jsx";

const DROPDOWN_WIDTH = 200;

export function PostTypeDropdown({ value, onChange }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  function openDropdown() {
    triggerRef.current?.measureInWindow((x, y, _w, h) => {
      setDropPos({ top: y + h, left: x });
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
  }

  function select(t) {
    onChange(t);
    close();
  }

  const typeColor = POST_TYPES[value]?.color ?? "#1A1A20";

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openDropdown}
        hitSlop={8}
        className="flex-row items-center"
      >
        <Text
          className="font-ui text-2xl font-bold tracking-tight mr-1.5"
          style={{ color: typeColor, includeFontPadding: false }}
        >
          {value}
        </Text>
        <Text className="font-ui text-lg text-base-content/45">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <Pressable className="flex-1" onPress={close}>
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
            {POST_TYPE_NAMES.map((t) => {
              const info = POST_TYPES[t];
              const selected = t === value;
              return (
                <Pressable
                  key={t}
                  onPress={() => select(t)}
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                  className={`flex-row items-center px-4 py-3 ${
                    selected ? "bg-secondary" : ""
                  }`}
                >
                  <PostTypeIcon
                    type={t}
                    size={15}
                    color={selected ? "#FAF4E8" : info.color}
                  />
                  <Text
                    className={`font-ui uppercase tracking-[0.14em] text-xs ml-3 ${
                      selected ? "text-secondary-content" : "text-base-content"
                    }`}
                  >
                    {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
