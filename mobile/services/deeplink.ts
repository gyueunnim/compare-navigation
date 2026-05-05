import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AppType } from '../types';
import { APP_CONFIG } from '../constants/apps';

interface Coordinate {
  lat: number;
  lng: number;
}

export async function openNavigationApp(
  app: AppType,
  start: Coordinate,
  end: Coordinate
): Promise<void> {
  const config = APP_CONFIG[app];
  const url = config.deeplink(start, end);

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  const storeUrl =
    Platform.OS === 'ios' ? config.storeUrl.ios : config.storeUrl.android;
  await Linking.openURL(storeUrl);
}
