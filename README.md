# 내비 비교 (Compare Navigation)

네이버 지도, T맵, 카카오맵 3개 앱의 경로를 한 번에 비교하고 원하는 앱으로 바로 이동하는 모바일 앱입니다.

## 구조

```
compare-navigation/
├── mobile/   # React Native + Expo (iOS/Android)
└── server/   # Node.js + Express (API 프록시)
```

## 실행 방법

### 서버

```bash
cd server
cp .env.example .env   # API 키 입력
npm install
npm run dev            # http://localhost:3000
```

### 모바일

```bash
cd mobile
cp .env.example .env.local   # 서버 URL 설정
npm install
npx expo start
```

> 딥링크 테스트는 Expo Go 앱에서 불가합니다. `npx expo run:ios` 또는 `npx expo run:android`로 네이티브 빌드가 필요합니다.

## 필요한 API 키

| 키 이름 | 발급처 |
|---------|--------|
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | [네이버 Cloud Platform](https://www.ncloud.com/) - Maps Directions API |
| `TMAP_APP_KEY` | [SK Open API](https://openapi.sk.com/) - T맵 Routing API |
| `KAKAO_REST_API_KEY` | [Kakao Developers](https://developers.kakao.com/) - 로컬 API (주소 검색) |
| `KAKAO_MOBILITY_KEY` | [Kakao Developers](https://developers.kakao.com/) - 모빌리티 Directions API |

## 주요 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/geocode?query=강남역` | 주소 → 좌표 변환 |
| `GET /api/directions?startLat=&startLng=&endLat=&endLng=` | 경로 비교 (3개 앱 병렬 조회) |

## 안내 사항

각 내비게이션 서비스의 경로 계산 방식에 따라 실제 결과는 차이가 있을 수 있습니다.
