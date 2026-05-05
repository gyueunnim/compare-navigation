import axios from 'axios';
import { GeocodeResult } from '../types';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const BASE_URL = 'https://dapi.kakao.com/v2/local';

async function searchByAddress(query: string): Promise<GeocodeResult[]> {
  const res = await axios.get(`${BASE_URL}/search/address.json`, {
    params: { query, size: 5 },
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    timeout: 5000,
  });
  return res.data.documents.map((doc: { address_name: string; x: string; y: string }) => ({
    address: doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  }));
}

async function searchByKeyword(query: string): Promise<GeocodeResult[]> {
  const res = await axios.get(`${BASE_URL}/search/keyword.json`, {
    params: { query, size: 5 },
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    timeout: 5000,
  });
  return res.data.documents.map((doc: { place_name: string; road_address_name: string; address_name: string; x: string; y: string }) => ({
    address: doc.road_address_name || doc.address_name || doc.place_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  }));
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  let results = await searchByAddress(query);
  if (results.length === 0) {
    results = await searchByKeyword(query);
  }
  return results;
}
