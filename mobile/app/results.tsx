import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  }>();

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
    const s = response.results.filter((r) => r.status === 'success');
    return s.reduce<RouteResult | null>((m, r) => (!m || r.duration < m.duration ? r : m), null)?.app ?? null;
  })();

  const cheapestApp = (() => {
    if (!response) return null;
    // 통행료가 있는 경우만 비교 (0원끼리는 비교 불필요)
    const s = response.results.filter((r) => r.status === 'success' && r.toll > 0);
    return s.reduce<RouteResult | null>((m, r) => (!m || r.toll < m.toll ? r : m), null)?.app ?? null;
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
        animationType="slide"
        transparent
        onRequestClose={() => setEditMode(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode === 'origin' ? '출발지 변경' : '도착지 변경'}
              </Text>
              <TouchableOpacity onPress={() => setEditMode(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#555" />
              ) : (
                <Text style={styles.locationBtnText}>📍 현재 위치로 설정</Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={handleEditTextChange}
              placeholder={editMode === 'origin' ? '출발지 주소 또는 장소명' : '도착지 주소 또는 장소명'}
              placeholderTextColor="#AAAAAA"
              autoFocus
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
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    gap: 8,
  },
  routeLabelBtn: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  routeLabelHint: {
    fontSize: 10,
    color: '#AAAAAA',
    fontWeight: '600',
    marginBottom: 1,
  },
  routeLabelText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapIcon: {
    fontSize: 16,
    color: '#555555',
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
  // 편집 모달
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#888888',
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  modalList: {
    marginTop: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalItemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8E8',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalItemAddr: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  modalItemText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  modalEmpty: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#AAAAAA',
  },
  locationBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
});
