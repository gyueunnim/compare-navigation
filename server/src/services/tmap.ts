import axios from 'axios';
import { Coordinate, RouteResult } from '../types';

export async function getTmapRoute(start: Coordinate, end: Coordinate): Promise<RouteResult> {
  try {
    const res = await axios.post(
      'https://apis.openapi.sk.com/tmap/routes',
      {
        startX: start.lng,
        startY: start.lat,
        endX: end.lng,
        endY: end.lat,
        reqCoordType: 'WGS84GEO',
        resCoordType: 'WGS84GEO',
        searchOption: '0',
      },
      {
        headers: {
          appKey: process.env.TMAP_APP_KEY!,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const props = res.data?.features?.[0]?.properties;
    if (!props) {
      return { app: 'tmap', duration: 0, distance: 0, cost: null, status: 'no_route' };
    }

    const duration = Math.ceil(props.totalTime / 60);
    const distance = parseFloat((props.totalDistance / 1000).toFixed(1));
    const cost = props.totalFare > 0 ? props.totalFare : null;

    return { app: 'tmap', duration, distance, cost, status: 'success' };
  } catch (err) {
    console.error('[tmap]', err);
    return { app: 'tmap', duration: 0, distance: 0, cost: null, status: 'error', errorMessage: 'T맵 오류' };
  }
}
