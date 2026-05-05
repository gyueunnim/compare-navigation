import { Router, Request, Response } from 'express';
import { getNaverRoute } from '../services/naver';
import { getTmapRoute } from '../services/tmap';
import { getKakaoRoute } from '../services/kakao';
import { Coordinate, RouteResult } from '../types';

const router = Router();

function parseCoord(lat: unknown, lng: unknown): Coordinate | null {
  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);
  if (
    isNaN(parsedLat) || isNaN(parsedLng) ||
    parsedLat < -90 || parsedLat > 90 ||
    parsedLng < -180 || parsedLng > 180
  ) {
    return null;
  }
  return { lat: parsedLat, lng: parsedLng };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { startLat, startLng, endLat, endLng, startAddr, endAddr } = req.query;

  const start = parseCoord(startLat, startLng);
  const end = parseCoord(endLat, endLng);

  if (!start || !end) {
    res.status(400).json({ error: '유효한 출발지/목적지 좌표를 입력해주세요.' });
    return;
  }

  if (startAddr) start.address = startAddr as string;
  if (endAddr) end.address = endAddr as string;

  const [naverRes, tmapRes, kakaoRes] = await Promise.allSettled([
    getNaverRoute(start, end),
    getTmapRoute(start, end),
    getKakaoRoute(start, end),
  ]);

  const toResult = (settled: PromiseSettledResult<RouteResult>, app: RouteResult['app']): RouteResult => {
    if (settled.status === 'fulfilled') return settled.value;
    return { app, duration: 0, distance: 0, toll: 0, fuel: null, status: 'error', errorMessage: `${app} 연결 실패` };
  };

  res.json({
    results: [
      toResult(naverRes, 'naver'),
      toResult(tmapRes, 'tmap'),
      toResult(kakaoRes, 'kakao'),
    ],
    origin: start,
    destination: end,
  });
});

export default router;
