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
  cost: number | null;
  status: RouteStatus;
  errorMessage?: string;
}

export interface DirectionsResponse {
  results: RouteResult[];
  origin: Coordinate;
  destination: Coordinate;
}

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}
