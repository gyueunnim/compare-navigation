import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function LoadingCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.headerRow}>
        <View style={styles.appNamePlaceholder} />
        <View style={styles.badgePlaceholder} />
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statPlaceholder} />
        <View style={styles.statPlaceholder} />
        <View style={styles.statPlaceholder} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appNamePlaceholder: {
    height: 20,
    width: 80,
    backgroundColor: '#C8C8C8',
    borderRadius: 4,
  },
  badgePlaceholder: {
    height: 20,
    width: 60,
    backgroundColor: '#C8C8C8',
    borderRadius: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPlaceholder: {
    flex: 1,
    height: 40,
    backgroundColor: '#C8C8C8',
    borderRadius: 8,
  },
});
