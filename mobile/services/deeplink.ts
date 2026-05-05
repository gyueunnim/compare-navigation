import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
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
  end: Coordinate,
  startName?: string,
  endName?: string
): Promise<void> {
  const config = APP_CONFIG[app];
  const deepUrl = config.deeplink(start, end, startName, endName);

  if (Platform.OS === 'android') {
    try {
      // packageName을 명시한 명시적 인텐트 → Android 11+ 패키지 가시성 제한 우회
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: deepUrl,
        packageName: config.androidPackage,
        flags: 268435456, // FLAG_ACTIVITY_NEW_TASK
      });
    } catch {
      // 앱 미설치 시 스토어로 이동
      await Linking.openURL(config.storeUrl.android);
    }
    return;
  }

  // iOS: canOpenURL + LSApplicationQueriesSchemes 방식
  const storeUrl = config.storeUrl.ios;
  try {
    const canOpen = await Linking.canOpenURL(deepUrl);
    await Linking.openURL(canOpen ? deepUrl : storeUrl);
  } catch {
    await Linking.openURL(storeUrl);
  }
}
