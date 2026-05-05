import axios from 'axios';
import { Coordinate, RouteResult } from '../types';

export async function getKakaoRoute(start: Coordinate, end: Coordinate): Promise<RouteResult> {
  try {
    const res = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
      params: {
        origin: `${start.lng},${start.lat}`,
        destination: `${end.lng},${end.lat}`,
        priority: 'RECOMMEND',
      },
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_MOBILITY_KEY!}`,
        KA: 'sdk/js-2.4.2 os/web lang/ko-KR origin/http://localhost:3000',
      },
      timeout: 5000,
    });

    const route = res.data?.routes?.[0];
    if (!route || route.result_code !== 0) {
      return { app: 'kakao', duration: 0, distance: 0, cost: null, status: 'no_route' };
    }

    const summary = route.summary;
    const duration = Math.ceil(summary.duration / 60);
    const distance = parseFloat((summary.distance / 1000).toFixed(1));
    const toll = summary.fare?.toll ?? 0;
    const cost = toll > 0 ? toll : null;

    return { app: 'kakao', duration, distance, cost, status: 'success' };
  } catch (err) {
    console.error('[kakao]', err);
    return { app: 'kakao', duration: 0, distance: 0, cost: null, status: 'error', errorMessage: '카카오맵 오류' };
  }
}
