import { AppType } from '../types';

interface Coordinate {
  lat: number;
  lng: number;
}

interface AppConfig {
  name: string;
  shortName: string;
  color: string;
  characteristic: string;
  deeplink: (start: Coordinate, end: Coordinate) => string;
  storeUrl: { ios: string; android: string };
}

export const APP_CONFIG: Record<AppType, AppConfig> = {
  naver: {
    name: '네이버 지도',
    shortName: '네이버',
    color: '#03C75A',
    characteristic: '균형 경로',
    deeplink: (s, e) =>
      `nmap://route/car?slat=${s.lat}&slng=${s.lng}&dlat=${e.lat}&dlng=${e.lng}&appname=com.comparenavigation`,
    storeUrl: {
      ios: 'https://apps.apple.com/kr/app/id311867728',
      android: 'market://details?id=com.nhn.android.nmap',
    },
  },
  tmap: {
    name: 'T맵',
    shortName: 'T맵',
    color: '#E51937',
    characteristic: '빠른 길',
    deeplink: (s, e) =>
      `tmap://route?startx=${s.lng}&starty=${s.lat}&goalx=${e.lng}&goaly=${e.lat}`,
    storeUrl: {
      ios: 'https://apps.apple.com/kr/app/id431589174',
      android: 'market://details?id=com.skt.tmap.ku',
    },
  },
  kakao: {
    name: '카카오맵',
    shortName: '카카오',
    color: '#FAE100',
    characteristic: '대안 경로',
    deeplink: (s, e) =>
      `kakaomap://route?sp=${s.lat},${s.lng}&ep=${e.lat},${e.lng}&by=CAR`,
    storeUrl: {
      ios: 'https://apps.apple.com/kr/app/id304608425',
      android: 'market://details?id=net.daum.android.map',
    },
  },
};

export const APP_ORDER: AppType[] = ['naver', 'tmap', 'kakao'];
