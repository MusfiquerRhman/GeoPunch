import type { ConfigContext, ExpoConfig } from "expo/config";
import { AndroidConfig, withAndroidManifest } from "expo/config-plugins";

const isProductionBuild = process.env.EAS_BUILD_PROFILE === "production";
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (isProductionBuild && (!apiUrl || !apiUrl.startsWith("https://"))) {
  throw new Error("Production Android builds require EXPO_PUBLIC_API_URL to use HTTPS.");
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
    process.env.EAS_BUILD_PROFILE !== "production" &&
    process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP === "true" &&
    apiUrl?.startsWith("http://") === true;

  return withAndroidAppSettings(completeConfig, allowDevelopmentHttp);
};
