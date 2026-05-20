import Constants from "expo-constants";

const CMS_DEMO_PORT = "3000";
const IPV4_RE = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;

function hostFromDebuggerUri(uri: string | undefined): string | null {
  if (!uri) return null;
  const match = uri.match(IPV4_RE);
  const host = match?.[1];
  if (!host || host === "127.0.0.1") return null;
  return host;
}

function getExpoDevMachineHost(): string | null {
  const expoGo = Constants.expoGoConfig as
    | { debuggerHost?: string }
    | undefined;
  const fromExpoGo = hostFromDebuggerUri(expoGo?.debuggerHost);
  if (fromExpoGo) return fromExpoGo;

  const manifest2 = Constants.manifest2 as
    | { extra?: { expoClient?: { hostUri?: string } } }
    | undefined;
  const fromManifest = hostFromDebuggerUri(
    manifest2?.extra?.expoClient?.hostUri
  );
  if (fromManifest) return fromManifest;

  const legacy = Constants.manifest as { debuggerHost?: string } | undefined;
  return hostFromDebuggerUri(legacy?.debuggerHost);
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  const fromExtra = (
    Constants.expoConfig?.extra as { apiUrl?: string } | undefined
  )?.apiUrl;
  if (fromExtra) {
    return normalizeBaseUrl(fromExtra);
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv?.trim()) {
    return normalizeBaseUrl(fromEnv.trim());
  }

  const devHost = getExpoDevMachineHost();
  if (devHost) {
    return `http://${devHost}:${CMS_DEMO_PORT}`;
  }

  return `http://localhost:${CMS_DEMO_PORT}`;
}

export function getIntakeApiUrl(): string {
  return `${getApiBaseUrl()}/api/warehouse/intake`;
}
