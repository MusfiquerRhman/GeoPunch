import type { ConfigContext, ExpoConfig } from "expo/config";
import { AndroidConfig, withAndroidManifest } from "expo/config-plugins";

const isReleaseBuild = ["preview", "production"].includes(process.env.EAS_BUILD_PROFILE ?? "");
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (isReleaseBuild && (!apiUrl || !apiUrl.startsWith("https://"))) {
  throw new Error("Preview and production builds require an HTTPS EXPO_PUBLIC_API_URL for device approval.");
}

function withAndroidAppSettings(config: ExpoConfig, allowDevelopmentHttp: boolean) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    mainApplication.$["android:usesCleartextTraffic"] = allowDevelopmentHttp ? "true" : "false";

    return modConfig;
  });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const completeConfig = config as ExpoConfig;
  const allowDevelopmentHttp =
    !isReleaseBuild &&
    process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP === "true" &&
    apiUrl?.startsWith("http://") === true;

  return withAndroidAppSettings(completeConfig, allowDevelopmentHttp);
};
