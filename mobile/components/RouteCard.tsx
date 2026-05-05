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
  const isDisabled = result.status !== 'success';

  if (result.status === 'error' || result.status === 'no_route') {
    const msg = result.status === 'no_route' ? '경로 없음' : '조회 실패';
    return (
      <View style={[styles.card, styles.disabledCard]}>
        <View style={styles.headerRow}>
          <Text style={[styles.appName, styles.disabledText]}>{config.name}</Text>
        </View>
        <Text style={styles.disabledMessage}>{msg}</Text>
        {result.errorMessage && (
          <Text style={styles.errorDetail}>{result.errorMessage}</Text>
        )}
      </View>
    );
  }

  const tollLabel = result.toll > 0 ? formatMoney(result.toll) : '무료';
  const hasToll = result.toll > 0;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
    >
      <View style={styles.headerRow}>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{config.name}</Text>
          <Text style={styles.characteristic}>{config.characteristic}</Text>
        </View>
        <View style={styles.badges}>
          {isFastest && <View style={[styles.badge, styles.fastBadge]}><Text style={styles.badgeText}>가장 빠름</Text></View>}
          {isCheapest && <View style={[styles.badge, styles.cheapBadge]}><Text style={styles.badgeText}>가장 저렴</Text></View>}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(result.duration)}</Text>
          <Text style={styles.statLabel}>소요 시간</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.distance}km</Text>
          <Text style={styles.statLabel}>거리</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, hasToll && styles.tollValue]}>{tollLabel}</Text>
          <Text style={styles.statLabel}>통행료</Text>
        </View>
      </View>

      {result.fuel !== null && (
        <View style={styles.fuelRow}>
          <Text style={styles.fuelLabel}>유류비(추정)</Text>
          <Text style={styles.fuelValue}>약 {formatMoney(result.fuel)}</Text>
        </View>
      )}

      <Text style={[styles.launchHint, { color: config.color }]}>
        길안내 시작 →
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  disabledCard: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#CCCCCC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appInfo: {
    gap: 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  characteristic: {
    fontSize: 12,
    color: '#888888',
  },
  disabledText: {
    color: '#999999',
  },
  disabledMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorDetail: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 160,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fastBadge: {
    backgroundColor: '#EBF5FF',
  },
  cheapBadge: {
    backgroundColor: '#EDFBF0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tollValue: {
    color: '#D94F4F',
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  fuelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fuelLabel: {
    fontSize: 12,
    color: '#888888',
  },
  fuelValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B07A00',
  },
  launchHint: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});
