import { useMemo } from "react";
import { Linking, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { locationMapHtml, type LocationMapProps } from "./location-map-html";

export default function LocationMap({ latitude, longitude, offices }: LocationMapProps) {
  const source = useMemo(() => ({ html: locationMapHtml({ latitude, longitude, offices }) }), [latitude, longitude, offices]);
  return (
    <WebView
      style={{ flex: 1 }}
      source={source}
      originWhitelist={["*"]}
      applicationNameForUserAgent="GeoPunch/1.0"
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={({ url }) => {
        if (url === "about:blank") return true;
        if (url.startsWith("https://www.openstreetmap.org/")) void Linking.openURL(url);
        return false;
      }}
      renderError={() => <View style={{ padding: 16 }}><Text>Map unavailable. Check your internet connection.</Text></View>}
    />
  );
}
