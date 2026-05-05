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
        <View style={[styles.header, { backgroundColor: '#F5F5F5' }]}>
          <View style={[styles.colorBar, { backgroundColor: '#CCCCCC' }]} />
          <Text style={[styles.appName, { color: '#999999' }]}>{config.name}</Text>
        </View>
        <View style={styles.errorBody}>
          <Text style={styles.errorMsg}>
            {result.status === 'no_route' ? '경로를 찾을 수 없습니다' : '조회에 실패했습니다'}
          </Text>
          {result.errorMessage && (
            <Text style={styles.errorDetail}>{result.errorMessage}</Text>
          )}
        </View>
      </View>
    );
  }

  const tollLabel = result.toll > 0 ? formatMoney(result.toll) : '무료';
  const tintColor = config.color + '22';  // 13% 투명도 틴트

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* 헤더: 앱 이름 + 배지 */}
      <View style={[styles.header, { backgroundColor: tintColor }]}>
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
          <Text style={[styles.statValue, result.toll > 0 && styles.tollPaid]}>
            {tollLabel}
          </Text>
          <Text style={styles.statLabel}>통행료</Text>
        </View>
      </View>

      {/* 길안내 버튼 */}
      <View style={[styles.launchBtn, { backgroundColor: config.color }]}>
        <Text style={[styles.launchText, { color: config.onColor }]}>
          길안내 시작하기 →
        </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 14,
    gap: 12,
  },
  colorBar: {
    width: 5,
    alignSelf: 'stretch',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  characteristic: {
    fontSize: 12,
    color: '#777777',
  },
  badges: {
    gap: 5,
    alignItems: 'flex-end',
  },
  fastBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  fastBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cheapBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  cheapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryStat: {
    flex: 1.2,
    alignItems: 'center',
    gap: 3,
  },
  primaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tollPaid: {
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F0F0F0',
  },
  launchBtn: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  launchText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // 에러 상태
  errorBody: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  errorMsg: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  errorDetail: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});
