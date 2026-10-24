import { useMemo } from "react";

import { locationMapHtml, type LocationMapProps } from "./location-map-html";

export default function LocationMap({ latitude, longitude, offices }: LocationMapProps) {
  const html = useMemo(() => locationMapHtml({ latitude, longitude, offices }), [latitude, longitude, offices]);
  return (
    <iframe
      title="Current location and offices"
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{ width: "100%", height: "100%", border: 0 }}
    />
  );
}
