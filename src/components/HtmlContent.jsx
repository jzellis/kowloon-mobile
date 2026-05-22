// Renders server HTML (post body / summary) as native components, styled to
// the editorial theme.
//
// Posts come back with server-rendered HTML in `body`/`summary` (the Markdown
// source isn't included in feed objects), so the app renders HTML rather than
// Markdown.
//
// `fonts` lets reading surfaces (the post detail) pass the user's chosen
// typography fonts; the feed card uses the Inter defaults.

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import { fontName } from "../lib/typography.js";

const INK = "#1A1A20";
const MUTED = "rgba(26,26,32,0.62)";
const PRIMARY = "#5588B1";
const RULE = "#DDD0B5";
const CODE_BG = "#EFE6D4";

const DEFAULT_FONTS = {
  regular: fontName("inter", "regular"),
  bold: fontName("inter", "bold"),
  italic: fontName("inter", "italic"),
};

function buildTagStyles(fonts, fontSize) {
  return {
    body: { color: INK },
    p: { marginTop: 0, marginBottom: fontSize * 0.7 },
    strong: { fontFamily: fonts.bold },
    b: { fontFamily: fonts.bold },
    em: { fontFamily: fonts.italic },
    i: { fontFamily: fonts.italic },
    a: { color: PRIMARY, textDecorationLine: "none" },
    h1: {
      fontFamily: fonts.bold,
      fontSize: Math.round(fontSize * 1.6),
      marginTop: fontSize * 0.6,
      marginBottom: fontSize * 0.4,
    },
    h2: {
      fontFamily: fonts.bold,
      fontSize: Math.round(fontSize * 1.35),
      marginTop: fontSize * 0.6,
      marginBottom: fontSize * 0.4,
    },
    h3: {
      fontFamily: fonts.bold,
      fontSize: Math.round(fontSize * 1.15),
      marginTop: fontSize * 0.5,
      marginBottom: fontSize * 0.3,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: PRIMARY,
      paddingLeft: 14,
      marginLeft: 0,
      marginVertical: fontSize * 0.5,
      color: MUTED,
      fontFamily: fonts.italic,
    },
    ul: { marginTop: 0, marginBottom: fontSize * 0.7 },
    ol: { marginTop: 0, marginBottom: fontSize * 0.7 },
    li: { marginBottom: fontSize * 0.2 },
    code: {
      fontFamily: "monospace",
      backgroundColor: CODE_BG,
      fontSize: Math.round(fontSize * 0.9),
    },
    pre: {
      fontFamily: "monospace",
      backgroundColor: CODE_BG,
      padding: 12,
      marginVertical: fontSize * 0.5,
      fontSize: Math.round(fontSize * 0.9),
    },
    hr: {
      backgroundColor: RULE,
      height: 2,
      marginVertical: fontSize * 0.8,
    },
  };
}

export function HtmlContent({
  html,
  fonts = DEFAULT_FONTS,
  fontSize = 15,
  lineHeight,
  color = INK,
  selectable = false,
}) {
  const { width } = useWindowDimensions();

  const baseStyle = useMemo(
    () => ({
      fontFamily: fonts.regular,
      fontSize,
      lineHeight: lineHeight || Math.round(fontSize * 1.55),
      color,
    }),
    [fonts.regular, fontSize, lineHeight, color]
  );

  const tagsStyles = useMemo(
    () => buildTagStyles(fonts, fontSize),
    [fonts, fontSize]
  );

  const systemFonts = useMemo(
    () => [fonts.regular, fonts.bold, fonts.italic, "monospace"],
    [fonts]
  );

  if (!html) return null;

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html }}
      baseStyle={baseStyle}
      tagsStyles={tagsStyles}
      systemFonts={systemFonts}
      defaultTextProps={{ selectable }}
      enableExperimentalMarginCollapsing
    />
  );
}
