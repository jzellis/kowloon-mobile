// Exact keyboard inset for layouts that must end at the keyboard's top edge.
//
// Rather than guessing nav-bar offsets on top of the keyboard's reported
// height, this measures the distance from the keyboard's top (the event's
// `endCoordinates.screenY`) to the bottom of the window. That span covers the
// keyboard body plus anything beneath it (system nav bar, gesture area), so
// padding a container by it lands the content exactly above the keyboard on
// any device / keyboard.

import { useEffect, useState } from "react";
import { Dimensions, Keyboard } from "react-native";

export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    function onShow(e) {
      const coords = e?.endCoordinates;
      const winH = Dimensions.get("window").height;
      if (coords && typeof coords.screenY === "number") {
        setInset(Math.max(0, winH - coords.screenY));
      } else if (coords?.height) {
        setInset(coords.height);
      }
    }
    function onHide() {
      setInset(0);
    }
    const show = Keyboard.addListener("keyboardDidShow", onShow);
    const hide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { isKeyboardUp: inset > 0, keyboardInset: inset };
}
