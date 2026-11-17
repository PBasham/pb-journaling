import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricSupport {
  available: boolean;
  /** "Face unlock", "Fingerprint" or "Biometrics". */
  label: string;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === 'web') return { available: false, label: 'Biometrics' };
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const { AuthenticationType } = LocalAuthentication;
    const label = types.includes(AuthenticationType.FACIAL_RECOGNITION)
      ? Platform.OS === 'ios'
        ? 'Face ID'
        : 'Face unlock'
      : types.includes(AuthenticationType.FINGERPRINT)
        ? Platform.OS === 'ios'
          ? 'Touch ID'
          : 'Fingerprint'
        : 'Biometrics';
    return { available: hasHardware && enrolled, label };
  } catch {
    return { available: false, label: 'Biometrics' };
  }
}

/** Shows the system biometric prompt. The app's own PIN or password is the fallback, not the device passcode. */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock PB Notes',
      cancelLabel: 'Use PIN or password',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
