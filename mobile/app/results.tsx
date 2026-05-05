import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LoadingCard } from '../components/LoadingCard';
import { RouteCard } from '../components/RouteCard';
import { openNavigationApp } from '../services/deeplink';
import { AppType, RouteResult } from '../types';
import { useRouteSearch } from '../hooks/useRouteSearch';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    startLat: string;
    startLng: string;
    endLat: string;
    endLng: string;
    startAddr?: string;
    endAddr?: string;
  }>();

  const { state, response, error, fetchByCoords, isLoading } = useRouteSearch();

  useEffect(() => {
    const { startLat, startLng, endLat, endLng, startAddr, endAddr } = params;
    if (!startLat || !startLng || !endLat || !endLng) return;

    fetchByCoords(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng),
      startAddr,
      endAddr
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fastestApp, cheapestApp } = useMemo(() => {
    if (!response) return { fastestApp: null, cheapestApp: null };

    const successes = response.results.filter((r) => r.status === 'success');
    const fastest = successes.reduce<RouteResult | null>(
      (min, r) => (!min || r.duration < min.duration ? r : min),
      null
    );
    const withCost = successes.filter((r) => r.cost !== null);
    const cheapest = withCost.reduce<RouteResult | null>(
      (min, r) => (!min || (r.cost! < min.cost!) ? r : min),
      null
    );

    return { fastestApp: fastest?.app ?? null, cheapestApp: cheapest?.app ?? null };
  }, [response]);

  async function handleCardPress(app: AppType) {
    if (!response) return;
    const start = { lat: response.origin.lat, lng: response.origin.lng };
    const end = { lat: response.destination.lat, lng: response.destination.lng };
    try {
      await openNavigationApp(app, start, end);
    } catch {
      Alert.alert('오류', '앱을 열 수 없습니다.');
    }
  }

  const originLabel = params.startAddr ?? `${params.startLat}, ${params.startLng}`;
  const destLabel = params.endAddr ?? `${params.endLat}, ${params.endLng}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeLabel} numberOfLines={1}>{originLabel}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.routeLabel} numberOfLines={1}>{destLabel}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        )}

        {state === 'error' && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {response && (
          <>
            {response.results
              .slice()
              .sort((a, b) => {
                if (a.status === 'success' && b.status !== 'success') return -1;
                if (a.status !== 'success' && b.status === 'success') return 1;
                return a.duration - b.duration;
              })
              .map((result) => (
                <RouteCard
                  key={result.app}
                  result={result}
                  isFastest={result.app === fastestApp}
                  isCheapest={result.app === cheapestApp}
                  onPress={() => handleCardPress(result.app)}
                />
              ))}

            <Text style={styles.disclaimer}>
              각 내비게이션 서비스의 경로 계산 방식에 따라 실제 결과는 차이가 있을 수 있습니다.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    gap: 8,
  },
  routeLabel: {
    flex: 1,
    fontSize: 13,
    color: '#444444',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#CC3333',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 8,
  },
});
