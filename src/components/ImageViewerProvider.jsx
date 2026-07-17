// ImageViewerProvider — tap any post image to view it fullscreen.
//
// A tiny, dependency-free lightbox: openViewer(urls, startIndex) shows the
// image(s) full-screen on black, swipe left/right between multiple, tap the
// image or the X to close. (Pinch-to-zoom-into-detail can be layered on later
// with gesture-handler if we want it.)

import { createContext, useCallback, useContext, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

const ImageViewerContext = createContext(null);

export function useImageViewer() {
  return useContext(ImageViewerContext);
}

export function ImageViewerProvider({ children }) {
  const [state, setState] = useState(null); // { images: [uri], index } | null

  const open = useCallback((images, index = 0) => {
    const list = (Array.isArray(images) ? images : [images]).filter(Boolean);
    if (list.length) setState({ images: list, index: Math.max(0, index) });
  }, []);

  const close = useCallback(() => setState(null), []);
  const { width, height } = Dimensions.get("window");

  return (
    <ImageViewerContext.Provider value={{ open }}>
      {children}
      <Modal
        visible={!!state}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black">
          <FlatList
            data={state?.images || []}
            keyExtractor={(u, i) => `${u}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={state?.index || 0}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
            renderItem={({ item }) => (
              <Pressable
                onPress={close}
                style={{ width, height }}
                className="items-center justify-center"
              >
                <Image
                  source={{ uri: item }}
                  style={{ width, height }}
                  resizeMode="contain"
                />
              </Pressable>
            )}
          />
          <SafeAreaView edges={["top"]} className="absolute top-0 right-0">
            <Pressable
              onPress={close}
              hitSlop={12}
              className="m-4 p-2 bg-white/10"
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
            >
              <X size={26} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </ImageViewerContext.Provider>
  );
}
