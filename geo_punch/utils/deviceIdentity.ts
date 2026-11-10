import { getRandomValues } from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const DEVICE_HEADER = "X-GeoPunch-Device";
const storageKey = "geopunch.deviceCredential";
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
let credential: string | undefined;
let loading: Promise<string> | undefined;

function createCredential() {
  return Array.from(getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readOrCreateCredential() {
  if (Platform.OS === "web") {
    const saved = localStorage.getItem(storageKey);
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
    const key = createCredential();
    localStorage.setItem(storageKey, key);
    return key;
  }

  const saved = await SecureStore.getItemAsync(storageKey, options);
  if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
  const key = createCredential();
  await SecureStore.setItemAsync(storageKey, key, options);
  return key;
}

export async function getDeviceCredential() {
  if (credential) return credential;
  loading ??= readOrCreateCredential().then((key) => {
    credential = key;
    return key;
  }).finally(() => { loading = undefined; });
  return loading;
}

export function getDeviceDetails() {
  return {
    name: Device.deviceName || Device.modelName || (Platform.OS === "web" ? "Web browser" : "Mobile device"),
    model: Device.modelName,
    platform: Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web",
    osVersion: Device.osVersion,
  };
}

export function selfieAuthHeaders(token: string | null) {
  // Login and saved-session validation load the device key before publishing a token.
  if (!token || !credential) return undefined;
  return { Authorization: `Bearer ${token}`, [DEVICE_HEADER]: credential };
}
