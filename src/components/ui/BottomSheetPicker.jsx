// BottomSheetPicker — tappable trigger + bottom-sheet list of options.
// Same shape as AudienceSelector / FeedViewSelector but generic.
//
// Each option: { value, label, summary?, group? }
//   value  — what gets returned via onChange and compared against `value`
//   label  — primary text on the row and on the trigger when selected
//   summary — optional second-line text
//   group  — optional section header to group rows under

import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BottomSheetPicker({
  label,
  value,
  options,
  onChange,
  placeholder = "Choose…",
  title,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  // Group options under section headers if any options have a `group` field.
  const sections = useMemo(() => {
    if (!options.some((o) => o.group)) return [{ heading: null, rows: options }];
    const groups = new Map();
    for (const opt of options) {
      const k = opt.group || "";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(opt);
    }
    return [...groups.entries()].map(([heading, rows]) => ({ heading, rows }));
  }, [options]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center border-2 border-base-content px-3 py-2.5"
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        {label ? (
          <Text className="font-ui uppercase tracking-[0.12em] text-[11px] text-base-content/50 mr-2">
            {label}
          </Text>
        ) : null}
        <Text
          className="font-ui uppercase tracking-[0.12em] text-[11px] text-base-content flex-1"
          numberOfLines={1}
        >
          {selected?.label || placeholder}
        </Text>
        <Text className="font-ui text-base-content/50 ml-1">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          {/* Inner Pressable swallows taps so they don't dismiss the sheet. */}
          <Pressable onPress={() => {}}>
            <SafeAreaView edges={["bottom"]} className="bg-base-100">
              <View className="border-t-2 border-base-content">
                {title ? (
                  <Text className="font-ui uppercase tracking-[0.18em] text-[11px] text-base-content/50 px-5 pt-4 pb-2">
                    {title}
                  </Text>
                ) : null}
                <ScrollView className="max-h-96">
                  {sections.map(({ heading, rows }, sIdx) => (
                    <View
                      key={heading || `sec-${sIdx}`}
                      className={sIdx > 0 ? "border-t-2 border-base-300 mt-1 pt-1" : ""}
                    >
                      {heading ? (
                        <Text className="font-ui uppercase tracking-[0.18em] text-[10px] text-base-content/40 px-5 py-2">
                          {heading}
                        </Text>
                      ) : null}
                      {rows.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() => {
                              onChange(opt.value);
                              setOpen(false);
                            }}
                            android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                            className={`px-5 py-3 ${
                              isSelected ? "bg-secondary" : ""
                            }`}
                          >
                            <Text
                              className={`font-ui uppercase tracking-[0.14em] text-xs ${
                                isSelected
                                  ? "text-secondary-content"
                                  : "text-base-content"
                              }`}
                            >
                              {opt.label}
                            </Text>
                            {opt.summary ? (
                              <Text
                                className={`font-ui text-xs mt-0.5 ${
                                  isSelected
                                    ? "text-secondary-content/70"
                                    : "text-base-content/45"
                                }`}
                              >
                                {opt.summary}
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
