import axios from 'axios';
import Constants from 'expo-constants';
import { DirectionsResponse, GeocodeResult } from '../types';

function resolveBaseUrl(): string {
  // Expo Go 실행 시 Metro 번들러 호스트에서 IP 자동 추출
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000`;
  }
  // 수동 설정 fallback
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
}

const BASE_URL = resolveBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
