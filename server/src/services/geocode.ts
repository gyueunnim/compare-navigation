import axios from 'axios';
import { GeocodeResult } from '../types';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const BASE_URL = 'https://dapi.kakao.com/v2/local';
const HEADERS = { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` };

async function searchByKeyword(query: string): Promise<GeocodeResult[]> {
  const res = await axios.get(`${BASE_URL}/search/keyword.json`, {
    params: { query, size: 5 },
    headers: HEADERS,
    timeout: 5000,
  });
  return res.data.documents.map((doc: {
    place_name: string;
    road_address_name: string;
    address_name: string;
    x: string;
    y: string;
  }) => ({
    name: doc.place_name,
    address: doc.road_address_name || doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  }));
}

async function searchByAddress(query: string): Promise<GeocodeResult[]> {
  const res = await axios.get(`${BASE_URL}/search/address.json`, {
    params: { query, size: 5 },
    headers: HEADERS,
    timeout: 5000,
  });
  return res.data.documents.map((doc: { address_name: string; x: string; y: string }) => ({
    address: doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  }));
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const [keywordResults, addressResults] = await Promise.allSettled([
    searchByKeyword(query),
    searchByAddress(query),
  ]);

  const keyword = keywordResults.status === 'fulfilled' ? keywordResults.value : [];
  const address = addressResults.status === 'fulfilled' ? addressResults.value : [];

  // 키워드 결과 우선, 좌표가 겹치는 주소 결과는 제외 후 뒤에 붙임
  const seen = new Set(keyword.map((r) => `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`));
  const uniqueAddress = address.filter(
    (r) => !seen.has(`${r.lat.toFixed(4)},${r.lng.toFixed(4)}`)
  );

  return [...keyword, ...uniqueAddress].slice(0, 7);
}
