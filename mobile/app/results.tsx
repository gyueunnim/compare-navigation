import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Location from 'expo-location';
import { LoadingCard } from '../components/LoadingCard';
import { RouteCard } from '../components/RouteCard';
import { openNavigationApp } from '../services/deeplink';
import { geocodeAddress } from '../services/api';
import { AppType, GeocodeResult, RouteResult } from '../types';
import { useRouteSearch } from '../hooks/useRouteSearch';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    startLat: string;
    startLng: string;
    endLat: string;
    endLng: string;
    startAddr?: string;
    endAddr?: string;
    apps?: string;
  }>();

  const enabledApps = new Set<AppType>(
    (params.apps ? params.apps.split(',') : ['naver', 'tmap', 'kakao']) as AppType[]
  );

  const { state, response, error, fetchByCoords, isLoading } = useRouteSearch();

  // 현재 출발지·도착지 (수정 가능)
  const [originLabel, setOriginLabel] = useState(
    params.startAddr ?? `${params.startLat}, ${params.startLng}`
  );
  const [destLabel, setDestLabel] = useState(
    params.endAddr ?? `${params.endLat}, ${params.endLng}`
  );
  const [currentCoords, setCurrentCoords] = useState({
    startLat: parseFloat(params.startLat),
    startLng: parseFloat(params.startLng),
    endLat: parseFloat(params.endLat),
    endLng: parseFloat(params.endLng),
    startAddr: params.startAddr ?? '',
    endAddr: params.endAddr ?? '',
  });

  // 편집 모달 상태
  const [editMode, setEditMode] = useState<'origin' | 'dest' | null>(null);
  const [editText, setEditText] = useState('');
  const [editCandidates, setEditCandidates] = useState<GeocodeResult[]>([]);
  const [isEditSearching, setIsEditSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function openEdit(mode: 'origin' | 'dest') {
    setEditText(mode === 'origin' ? originLabel : destLabel);
    setEditCandidates([]);
    setEditMode(mode);
  }

  function handleEditTextChange(text: string) {
    setEditText(text);
    setEditCandidates([]);
    if (editTimer.current) clearTimeout(editTimer.current);
    if (text.trim().length < 2) return;
    editTimer.current = setTimeout(async () => {
      setIsEditSearching(true);
      try {
        const results = await geocodeAddress(text.trim());
        setEditCandidates(results);
      } catch {}
      finally { setIsEditSearching(false); }
    }, 400);
  }

  function selectEditCandidate(item: GeocodeResult) {
    const label = item.name || item.address;
    if (editMode === 'origin') {
      setOriginLabel(label);
      const next = { ...currentCoords, startLat: item.lat, startLng: item.lng, startAddr: item.address };
      setCurrentCoords(next);
      fetchByCoords(item.lat, item.lng, next.endLat, next.endLng, item.address, next.endAddr);
    } else {
      setDestLabel(label);
      const next = { ...currentCoords, endLat: item.lat, endLng: item.lng, endAddr: item.address };
      setCurrentCoords(next);
      fetchByCoords(next.startLat, next.startLng, item.lat, item.lng, next.startAddr, item.address);
    }
    setEditMode(null);
  }

  async function handleCurrentLocation() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '현재 위치 사용을 위해 위치 권한을 허용해주세요.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const addr = [geo.city, geo.district || geo.subregion, geo.street].filter(Boolean).join(' ');
      const label = addr || `${loc.coords.latitude.toFixed(4)},${loc.coords.longitude.toFixed(4)}`;

      if (editMode === 'origin') {
        setOriginLabel(label);
        const next = { ...currentCoords, startLat: loc.coords.latitude, startLng: loc.coords.longitude, startAddr: label };
        setCurrentCoords(next);
        fetchByCoords(loc.coords.latitude, loc.coords.longitude, next.endLat, next.endLng, label, next.endAddr);
      } else {
        setDestLabel(label);
        const next = { ...currentCoords, endLat: loc.coords.latitude, endLng: loc.coords.longitude, endAddr: label };
        setCurrentCoords(next);
        fetchByCoords(next.startLat, next.startLng, loc.coords.latitude, loc.coords.longitude, next.startAddr, label);
      }
      setEditMode(null);
    } catch {
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setIsLocating(false);
    }
  }

  function handleSwap() {
    const next = {
      startLat: currentCoords.endLat,
      startLng: currentCoords.endLng,
      startAddr: currentCoords.endAddr,
      endLat: currentCoords.startLat,
      endLng: currentCoords.startLng,
      endAddr: currentCoords.startAddr,
    };
    setOriginLabel(destLabel);
    setDestLabel(originLabel);
    setCurrentCoords(next);
    fetchByCoords(next.startLat, next.startLng, next.endLat, next.endLng, next.startAddr, next.endAddr);
  }

  const fastestApp = (() => {
    if (!response) return null;
    const s = response.results.filter((r) => r.status === 'success' && enabledApps.has(r.app));
    if (s.length < 2) return null;
    const min = Math.min(...s.map((r) => r.duration));
    const winners = s.filter((r) => r.duration === min);
    return winners.length === 1 ? winners[0].app : null;
  })();

  const cheapestApp = (() => {
    if (!response) return null;
    const s = response.results.filter((r) => r.status === 'success' && r.toll > 0 && enabledApps.has(r.app));
    if (s.length < 2) return null;
    const min = Math.min(...s.map((r) => r.toll));
    const winners = s.filter((r) => r.toll === min);
    return winners.length === 1 ? winners[0].app : null;
  })();

  async function handleCardPress(app: AppType) {
    if (!response) return;
    const start = { lat: response.origin.lat, lng: response.origin.lng };
    const end = { lat: response.destination.lat, lng: response.destination.lng };
    try {
      await openNavigationApp(app, start, end, currentCoords.startAddr, currentCoords.endAddr);
    } catch {
      Alert.alert('오류', '앱을 열 수 없습니다.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 출발지·도착지 헤더 (탭하면 편집 모달) */}
      <View style={styles.routeHeader}>
        <TouchableOpacity style={styles.routeLabelBtn} onPress={() => openEdit('origin')} activeOpacity={0.7}>
          <Text style={styles.routeLabelHint}>출발</Text>
          <Text style={styles.routeLabelText} numberOfLines={1}>{originLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.7}>
          <Text style={styles.swapIcon}>⇄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.routeLabelBtn} onPress={() => openEdit('dest')} activeOpacity={0.7}>
          <Text style={styles.routeLabelHint}>도착</Text>
          <Text style={styles.routeLabelText} numberOfLines={1}>{destLabel}</Text>
        </TouchableOpacity>
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
              .filter((r) => enabledApps.has(r.app))
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

      {/* 출발지·도착지 편집 모달 */}
      <Modal
        visible={editMode !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setEditMode(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => { Keyboard.dismiss(); setEditMode(null); }} />
        <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode === 'origin' ? '출발지 변경' : '도착지 변경'}
              </Text>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity
                  style={styles.locationBtn}
                  onPress={handleCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#3B5BDB" />
                  ) : (
                    <Text style={styles.locationBtnText}>📍 현재 위치</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditMode(null)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={handleEditTextChange}
              placeholder={editMode === 'origin' ? '출발지 주소 또는 장소명' : '도착지 주소 또는 장소명'}
              placeholderTextColor="#AAAAAA"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />

            {isEditSearching && (
              <ActivityIndicator style={{ marginTop: 16 }} color="#888" />
            )}

            {!isEditSearching && editCandidates.length > 0 && (
              <FlatList
                data={editCandidates}
                keyExtractor={(_, i) => String(i)}
                keyboardShouldPersistTaps="handled"
                style={styles.modalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, index > 0 && styles.modalItemDivider]}
                    onPress={() => selectEditCandidate(item)}
                  >
                    {item.name ? (
                      <>
                        <Text style={styles.modalItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.modalItemAddr} numberOfLines={1}>{item.address}</Text>
                      </>
                    ) : (
                      <Text style={styles.modalItemText} numberOfLines={1}>{item.address}</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {!isEditSearching && editText.trim().length >= 2 && editCandidates.length === 0 && (
              <Text style={styles.modalEmpty}>검색 결과가 없습니다.</Text>
            )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  routeHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEF2FF',
    gap: 8,
  },
  routeLabelBtn: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#F8FAFF', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  routeLabelHint: { fontSize: 10, color: '#3B5BDB', fontWeight: '700', marginBottom: 1, letterSpacing: 0.3 },
  routeLabelText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  swapBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D7FD',
    justifyContent: 'center', alignItems: 'center',
  },
  swapIcon: { fontSize: 16, color: '#3B5BDB' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  errorBox: {
    backgroundColor: '#FFF1F1', borderRadius: 14,
    padding: 20, alignItems: 'center', marginTop: 20,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  errorText: { color: '#B91C1C', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  disclaimer: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16, marginTop: 8, paddingHorizontal: 8 },
  // 편집 모달
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,58,138,0.4)',
  },
  modalSheet: {
    position: 'absolute',
    top: '12%',
    left: 16, right: 16,
    maxHeight: '76%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  modalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 16, color: '#64748B' },
  modalInput: {
    height: 48, borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14,
    fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFF',
  },
  modalList: { marginTop: 8 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 4 },
  modalItemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  modalItemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  modalItemAddr: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalItemText: { fontSize: 14, color: '#1E293B' },
  modalEmpty: { marginTop: 24, textAlign: 'center', fontSize: 14, color: '#94A3B8' },
  locationBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#C7D7FD',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
    minWidth: 90,
  },
  locationBtnText: { fontSize: 13, fontWeight: '700', color: '#3B5BDB' },
});
