import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteResult } from '../types';
import { APP_CONFIG } from '../constants/apps';

interface RouteCardProps {
  result: RouteResult;
  isFastest: boolean;
  isCheapest: boolean;
  onPress: () => void;
}

function formatMoney(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export function RouteCard({ result, isFastest, isCheapest, onPress }: RouteCardProps) {
  const config = APP_CONFIG[result.app];

  if (result.status === 'error' || result.status === 'no_route') {
    return (
      <View style={styles.card}>
        <View style={styles.errorHeader}>
          <View style={[styles.colorBar, { backgroundColor: '#CBD5E1' }]} />
          <Text style={styles.errorAppName}>{config.name}</Text>
        </View>
        <View style={styles.errorBody}>
          <Text style={styles.errorMsg}>
            {result.status === 'no_route' ? '경로를 찾을 수 없습니다' : '조회에 실패했습니다'}
          </Text>
          {result.errorMessage && <Text style={styles.errorDetail}>{result.errorMessage}</Text>}
        </View>
      </View>
    );
  }

  const tollLabel = result.toll > 0 ? formatMoney(result.toll) : '무료';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={[styles.colorBar, { backgroundColor: config.color }]} />
        <View style={styles.headerContent}>
          <Text style={styles.appName}>{config.name}</Text>
          <Text style={styles.characteristic}>{config.characteristic}</Text>
        </View>
        <View style={styles.badges}>
          {isFastest && (
            <View style={styles.fastBadge}>
              <Text style={styles.fastBadgeText}>⚡ 가장 빠름</Text>
            </View>
          )}
          {isCheapest && (
            <View style={styles.cheapBadge}>
              <Text style={styles.cheapBadgeText}>💰 가장 저렴</Text>
            </View>
          )}
        </View>
      </View>

      {/* 스탯 */}
      <View style={styles.statsRow}>
        <View style={styles.primaryStat}>
          <Text style={styles.primaryValue}>{formatDuration(result.duration)}</Text>
          <Text style={styles.statLabel}>소요시간</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.distance} km</Text>
          <Text style={styles.statLabel}>거리</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, result.toll > 0 && styles.tollPaid]}>{tollLabel}</Text>
          <Text style={styles.statLabel}>통행료</Text>
        </View>
      </View>

      {/* 길안내 버튼 — 테마 블루로 통일 */}
      <View style={styles.launchBtn}>
        <Text style={styles.launchText}>길안내 시작하기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 14,
    gap: 12,
    backgroundColor: '#F8FAFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
  },
  colorBar: {
    width: 5,
    alignSelf: 'stretch',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  headerContent: { flex: 1, gap: 2 },
  appName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  characteristic: { fontSize: 12, color: '#64748B' },
  badges: { gap: 5, alignItems: 'flex-end' },
  fastBadge: {
    backgroundColor: '#DBEAFE', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  fastBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  cheapBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  cheapBadgeText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryStat: { flex: 1.2, alignItems: 'center', gap: 4 },
  primaryValue: { fontSize: 24, fontWeight: '800', color: '#1E3A8A' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  tollPaid: { color: '#DC2626' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  statDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  launchBtn: {
    marginHorizontal: 14, marginBottom: 14,
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', backgroundColor: '#3B5BDB',
  },
  launchText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  // 에러
  errorHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
    backgroundColor: '#F8FAFF',
    borderBottomWidth: 1, borderBottomColor: '#EEF2FF',
  },
  errorAppName: { fontSize: 16, fontWeight: '700', color: '#94A3B8' },
  errorBody: { paddingVertical: 20, alignItems: 'center', gap: 4 },
  errorMsg: { fontSize: 14, color: '#94A3B8' },
  errorDetail: { fontSize: 12, color: '#CBD5E1' },
});
