import axios from 'axios';
import { Coordinate, RouteResult } from '../types';

export async function getNaverRoute(start: Coordinate, end: Coordinate): Promise<RouteResult> {
  try {
    const res = await axios.get('https://maps.apigw.ntruss.com/map-direction/v1/driving', {
      params: {
        start: `${start.lng},${start.lat}`,
        goal: `${end.lng},${end.lat}`,
        option: 'trafast',
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET!,
      },
      timeout: 5000,
    });

    const data = res.data;
    if (data.code !== 0) {
      return { app: 'naver', duration: 0, distance: 0, toll: 0, status: 'no_route' };
    }

    const summary = data.route?.trafast?.[0]?.summary;
    if (!summary) {
      return { app: 'naver', duration: 0, distance: 0, toll: 0, status: 'no_route' };
    }

    const duration = Math.ceil(summary.duration / 60000);
    const distance = parseFloat((summary.distance / 1000).toFixed(1));
    const toll = summary.tollFare ?? 0;

    return { app: 'naver', duration, distance, toll, status: 'success' };
  } catch (err) {
    console.error('[naver]', err);
    return { app: 'naver', duration: 0, distance: 0, toll: 0, status: 'error', errorMessage: '네이버 지도 오류' };
  }
}
