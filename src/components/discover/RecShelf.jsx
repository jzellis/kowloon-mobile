// RecShelf — one horizontal Discover shelf: a section title/blurb over a
// sideways-scrolling row of RecCards.

import { FlatList, Text, View } from "react-native";

import { RecCard } from "./RecCard.jsx";

export function RecShelf({ section, baseUrl }) {
  if (!section?.items?.length) return null;
  return (
    <View className="mb-7">
      <View className="px-5 mb-3">
        <Text className="font-ui text-lg font-bold text-base-content leading-tight">
          {section.name}
        </Text>
        {section.summary ? (
          <Text className="font-ui text-xs text-base-content/55 mt-0.5" numberOfLines={2}>
            {section.summary}
          </Text>
        ) : null}
      </View>
      <FlatList
        data={section.items}
        keyExtractor={(it, i) => `${it.id}:${i}`}
        renderItem={({ item }) => <RecCard item={item} baseUrl={baseUrl} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      />
    </View>
  );
}
