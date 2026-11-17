import Constants from 'expo-constants';

/** True in a dev server session or the development build ("PB Notes (Dev)"), never in the store app. */
export const devToolsEnabled: boolean = __DEV__ || Constants.expoConfig?.extra?.devTools === true;
