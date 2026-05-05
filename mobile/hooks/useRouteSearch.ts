import { useState, useCallback } from 'react';
import { geocodeAddress, getDirections } from '../services/api';
import { DirectionsResponse, GeocodeResult } from '../types';

type SearchState = 'idle' | 'geocoding' | 'fetching' | 'done' | 'error';

export function useRouteSearch() {
  const [state, setState] = useState<SearchState>('idle');
  const [response, setResponse] = useState<DirectionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [originCandidates, setOriginCandidates] = useState<GeocodeResult[]>([]);
  const [destCandidates, setDestCandidates] = useState<GeocodeResult[]>([]);

  const searchCandidates = useCallback(
    async (query: string, type: 'origin' | 'destination') => {
      if (!query.trim()) return;
      try {
        const results = await geocodeAddress(query);
        if (type === 'origin') setOriginCandidates(results);
        else setDestCandidates(results);
      } catch {
        /* silent - candidates are optional */
      }
    },
    []
  );

  const searchRoutes = useCallback(
    async (originText: string, destText: string) => {
      setError(null);
      setResponse(null);
      setState('geocoding');

      let originGeo: GeocodeResult;
      let destGeo: GeocodeResult;

      try {
        const [origins, dests] = await Promise.all([
          geocodeAddress(originText),
          geocodeAddress(destText),
        ]);

        if (!origins.length) {
          setError(`출발지 "${originText}"를 찾을 수 없습니다.`);
          setState('error');
          return;
        }
        if (!dests.length) {
          setError(`목적지 "${destText}"를 찾을 수 없습니다.`);
          setState('error');
          return;
        }

        originGeo = origins[0];
        destGeo = dests[0];
      } catch {
        setError('주소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
        setState('error');
        return;
      }

      setState('fetching');

      try {
        const data = await getDirections(
          originGeo.lat,
          originGeo.lng,
          destGeo.lat,
          destGeo.lng,
          originGeo.address,
          destGeo.address
        );
        setResponse(data);
        setState('done');
      } catch {
        setError('경로 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setState('error');
      }
    },
    []
  );

  const fetchByCoords = useCallback(
    async (
      startLat: number, startLng: number,
      endLat: number, endLng: number,
      startAddr?: string, endAddr?: string
    ) => {
      setError(null);
      setResponse(null);
      setState('fetching');
      try {
        const data = await getDirections(startLat, startLng, endLat, endLng, startAddr, endAddr);
        setResponse(data);
        setState('done');
      } catch {
        setError('경로 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setState('error');
      }
    },
    []
  );

  return {
    state,
    response,
    error,
    originCandidates,
    destCandidates,
    searchCandidates,
    searchRoutes,
    fetchByCoords,
    isLoading: state === 'geocoding' || state === 'fetching',
  };
}
