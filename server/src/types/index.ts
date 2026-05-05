export type AppType = 'naver' | 'tmap' | 'kakao';
export type RouteStatus = 'success' | 'error' | 'no_route';

export interface Coordinate {
  lat: number;
  lng: number;
  address?: string;
}

export interface RouteResult {
  app: AppType;
  duration: number;
  distance: number;
  toll: number;         // 통행료 (0 = 무료)
  fuel: number | null;  // 유류비 추정 (네이버만 제공, null = 미제공)
  status: RouteStatus;
  errorMessage?: string;
}

export interface DirectionsResponse {
  results: RouteResult[];
  origin: Coordinate;
  destination: Coordinate;
}

export interface GeocodeResult {
  name?: string;
  address: string;
  lat: number;
  lng: number;
}
