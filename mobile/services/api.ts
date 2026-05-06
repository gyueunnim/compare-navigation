import axios from 'axios';
import Constants from 'expo-constants';
import { DirectionsResponse, GeocodeResult } from '../types';

function resolveBaseUrl(): string {
  // EXPO_PUBLIC_API_URL이 설정되어 있으면 우선 사용 (로컬/외부 수동 전환)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Expo Go 개발 중이면 Metro 번들러 호스트에서 IP 자동 추출
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

const client = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: {
    'X-API-Key': process.env.EXPO_PUBLIC_API_KEY ?? '',
  },
});

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const res = await client.get<{ results: GeocodeResult[] }>('/api/geocode', {
    params: { query },
  });
  return res.data.results;
}

export async function getDirections(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  startAddr?: string,
  endAddr?: string
): Promise<DirectionsResponse> {
  const res = await client.get<DirectionsResponse>('/api/directions', {
    params: { startLat, startLng, endLat, endLng, startAddr, endAddr },
  });
  return res.data;
}
