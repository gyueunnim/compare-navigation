import axios from 'axios';
import Constants from 'expo-constants';
import { DirectionsResponse, GeocodeResult } from '../types';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

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
