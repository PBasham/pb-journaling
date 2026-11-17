import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Builds on app.json. The development build installs as a separate app ("PB Notes (Dev)")
 * with its own id and data, so it can sit next to the real app on the same phone.
 * Set by eas.json: APP_VARIANT=development.
 */
const isDev = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (!isDev) return base;
  return {
    ...base,
    name: `${base.name} (Dev)`,
    // Shows Settings > Developer tools (sample data, resets) in the development build only.
    extra: { ...base.extra, devTools: true },
    scheme: `${String(base.scheme)}-dev`,
    ios: { ...base.ios, bundleIdentifier: `${base.ios?.bundleIdentifier}.dev` },
    android: { ...base.android, package: `${base.android?.package}.dev` },
  };
};
