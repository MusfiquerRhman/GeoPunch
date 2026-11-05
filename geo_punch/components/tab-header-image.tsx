import { Image } from "expo-image";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

type HeaderProps = {
  headerImage: ReactElement;
  headerBackgroundColor?: { light: string; dark: string };
};

export const TAB_HEADER_HEIGHT = 125;

export function TabHeader({ headerImage, headerBackgroundColor = { light: "#fff", dark: "#fff" } }: HeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  return <View style={[styles.header, { backgroundColor: headerBackgroundColor[colorScheme] }]}>{headerImage}</View>;
}

export default function TabHeaderImage() {
  return (
    <Image
      source={require("@/assets/images/Banner.svg")}
      contentFit="contain"
      accessibilityLabel="GeoPunch — Track, Snap, Verify"
      testID="geopunch-tab-header-image"
      style={styles.image}
    />
  );
}

const styles = StyleSheet.create({
  header: { height: TAB_HEADER_HEIGHT, overflow: "hidden" },
  image: { position: "absolute", height: "100%", width: "100%", bottom: 0, left: 0, backgroundColor: "#fff" },
});
