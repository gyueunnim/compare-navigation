import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { geocodeAddress } from '../services/api';
import { GeocodeResult, AppType } from '../types';
import { APP_CONFIG } from '../constants/apps';

type SelectedApps = Record<AppType, boolean>;

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCandidates, setOriginCandidates] = useState<GeocodeResult[]>([]);
  const [destCandidates, setDestCandidates] = useState<GeocodeResult[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<GeocodeResult | null>(null);
  const [selectedDest, setSelectedDest] = useState<GeocodeResult | null>(null);
  const [locatingFor, setLocatingFor] = useState<'origin' | 'dest' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedApps, setSelectedApps] = useState<SelectedApps>({ naver: true, tmap: true, kakao: true });

  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleApp(app: AppType) {
    const next = { ...selectedApps, [app]: !selectedApps[app] };
    if (!Object.values(next).some(Boolean)) return; // 최소 1개 유지
    setSelectedApps(next);
  }

  function handleOriginChange(text: string) {
    setOrigin(text);
    setSelectedOrigin(null);
    setOriginCandidates([]);
    if (originTimer.current) clearTimeout(originTimer.current);
    if (text.trim().length < 2) return;
    originTimer.current = setTimeout(async () => {
      try { setOriginCandidates(await geocodeAddress(text.trim())); } catch {}
    }, 400);
  }

  function handleDestChange(text: string) {
    setDestination(text);
    setSelectedDest(null);
    setDestCandidates([]);
    if (destTimer.current) clearTimeout(destTimer.current);
    if (text.trim().length < 2) return;
    destTimer.current = setTimeout(async () => {
      try { setDestCandidates(await geocodeAddress(text.trim())); } catch {}
    }, 400);
  }

  function selectOrigin(item: GeocodeResult) {
    setOrigin(item.name || item.address);
    setSelectedOrigin(item);
    setOriginCandidates([]);
  }

  function selectDest(item: GeocodeResult) {
    setDestination(item.name || item.address);
    setSelectedDest(item);
    setDestCandidates([]);
  }

  async function handleCurrentLocation(target: 'origin' | 'dest') {
    setLocatingFor(target);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('권한 필요', '위치 권한을 허용해주세요.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const addr = [geo.city, geo.district || geo.subregion, geo.street].filter(Boolean).join(' ');
      const label = addr || `${loc.coords.latitude.toFixed(4)},${loc.coords.longitude.toFixed(4)}`;
      const result: GeocodeResult = { address: label, lat: loc.coords.latitude, lng: loc.coords.longitude };
      if (target === 'origin') { setOrigin(label); setSelectedOrigin(result); setOriginCandidates([]); }
      else { setDestination(label); setSelectedDest(result); setDestCandidates([]); }
    } catch { Alert.alert('오류', '현재 위치를 가져올 수 없습니다.'); }
    finally { setLocatingFor(null); }
  }

  function handleSwap() {
    setOrigin(destination); setDestination(origin);
    setSelectedOrigin(selectedDest); setSelectedDest(selectedOrigin);
    setOriginCandidates([]); setDestCandidates([]);
  }

  async function handleSearch() {
    if (!origin.trim()) { Alert.alert('입력 필요', '출발지를 입력해주세요.'); return; }
    if (!destination.trim()) { Alert.alert('입력 필요', '목적지를 입력해주세요.'); return; }

    setIsSearching(true);
    try {
      let originResult = selectedOrigin;
      let destResult = selectedDest;

      if (!originResult) {
        const results = await geocodeAddress(origin.trim());
        if (!results.length) { Alert.alert('검색 실패', `출발지 "${origin}"를 찾을 수 없습니다.`); return; }
        originResult = results[0];
      }
      if (!destResult) {
        const results = await geocodeAddress(destination.trim());
        if (!results.length) { Alert.alert('검색 실패', `목적지 "${destination}"를 찾을 수 없습니다.`); return; }
        destResult = results[0];
      }

      const apps = (Object.keys(selectedApps) as AppType[]).filter(a => selectedApps[a]).join(',');

      router.push({
        pathname: '/results',
        params: {
          startLat: originResult.lat, startLng: originResult.lng,
          endLat: destResult.lat, endLng: destResult.lng,
          startAddr: originResult.address, endAddr: destResult.address,
          apps,
        },
      });
    } catch {
      Alert.alert('오류', '주소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    } finally { setIsSearching(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>BR</Text>
            </View>
            <View>
              <Text style={styles.title}>
                <Text style={styles.titleThin}>베스트</Text>
                <Text style={styles.titleBold}>루트</Text>
              </Text>
              <Text style={styles.subtitle}>카카오 네이버 티맵을 한눈에!</Text>
            </View>
          </View>
        </View>

        {/* 폼 카드 */}
        <View style={styles.form}>
          {/* 앱 선택 */}
          <View style={styles.appSelectorGroup}>
            <Text style={styles.label}>비교할 앱</Text>
            <View style={styles.appToggleRow}>
              {(['naver', 'tmap', 'kakao'] as AppType[]).map((app) => {
                const cfg = APP_CONFIG[app];
                const on = selectedApps[app];
                return (
                  <TouchableOpacity
                    key={app}
                    style={[
                      styles.appToggle,
                      on
                        ? { borderColor: cfg.color, backgroundColor: cfg.color + '1A' }
                        : styles.appToggleOff,
                    ]}
                    onPress={() => toggleApp(app)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.appDot, { backgroundColor: on ? cfg.color : '#CBD5E1' }]} />
                    <Text style={[styles.appToggleText, !on && styles.appToggleTextOff]}>
                      {cfg.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* 출발지 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>출발지</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="주소 또는 장소명"
                placeholderTextColor="#94A3B8"
                value={origin}
                onChangeText={handleOriginChange}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.locationBtn} onPress={() => handleCurrentLocation('origin')} disabled={locatingFor !== null}>
                {locatingFor === 'origin' ? <ActivityIndicator size="small" color="#3B5BDB" /> : <Text style={styles.locationBtnText}>현위치</Text>}
              </TouchableOpacity>
            </View>
            {originCandidates.length > 0 && (
              <View style={styles.dropdown}>
                <FlatList
                  data={originCandidates} keyExtractor={(_, i) => String(i)}
                  keyboardShouldPersistTaps="handled" scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity style={[styles.dropdownItem, index > 0 && styles.dropdownDivider]} onPress={() => selectOrigin(item)}>
                      {item.name
                        ? <><Text style={styles.dropdownName} numberOfLines={1}>{item.name}</Text><Text style={styles.dropdownAddr} numberOfLines={1}>{item.address}</Text></>
                        : <Text style={styles.dropdownText} numberOfLines={1}>{item.address}</Text>}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          {/* 스왑 */}
          <View style={styles.swapRow}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.7}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
            <View style={styles.swapLine} />
          </View>

          {/* 목적지 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>목적지</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="주소 또는 장소명"
                placeholderTextColor="#94A3B8"
                value={destination}
                onChangeText={handleDestChange}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.locationBtn} onPress={() => handleCurrentLocation('dest')} disabled={locatingFor !== null}>
                {locatingFor === 'dest' ? <ActivityIndicator size="small" color="#3B5BDB" /> : <Text style={styles.locationBtnText}>현위치</Text>}
              </TouchableOpacity>
            </View>
            {destCandidates.length > 0 && (
              <View style={styles.dropdown}>
                <FlatList
                  data={destCandidates} keyExtractor={(_, i) => String(i)}
                  keyboardShouldPersistTaps="handled" scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity style={[styles.dropdownItem, index > 0 && styles.dropdownDivider]} onPress={() => selectDest(item)}>
                      {item.name
                        ? <><Text style={styles.dropdownName} numberOfLines={1}>{item.name}</Text><Text style={styles.dropdownAddr} numberOfLines={1}>{item.address}</Text></>
                        : <Text style={styles.dropdownText} numberOfLines={1}>{item.address}</Text>}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
            onPress={handleSearch} activeOpacity={0.85} disabled={isSearching}
          >
            {isSearching
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.searchBtnText}>경로 비교하기</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          각 서비스의 경로 계산 방식에 따라 실제 결과는 차이가 있을 수 있습니다.
        </Text>
      </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 16,
  },
  // 헤더
  header: {},
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#3B5BDB',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10,
    elevation: 8,
  },
  logoText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  titleThin: { fontWeight: '300', color: '#1E3A8A' },
  titleBold: { fontWeight: '900', color: '#3B5BDB' },
  subtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 2 },
  // 폼
  form: {
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16,
    elevation: 3,
  },
  divider: { height: 1, backgroundColor: '#EEF2FF', marginVertical: 2 },
  // 앱 선택
  appSelectorGroup: { gap: 8 },
  appToggleRow: { flexDirection: 'row', gap: 8 },
  appToggle: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9,
    borderWidth: 1.5, borderRadius: 12,
  },
  appToggleOff: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFF' },
  appDot: { width: 8, height: 8, borderRadius: 4 },
  appToggleText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  appToggleTextOff: { color: '#94A3B8' },
  // 입력
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#3B5BDB', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, height: 48,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFF',
  },
  locationBtn: {
    height: 48, paddingHorizontal: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C7D7FD', borderRadius: 12,
    backgroundColor: '#EEF2FF', minWidth: 64,
  },
  locationBtnText: { fontSize: 12, fontWeight: '700', color: '#3B5BDB' },
  swapRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  swapLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D7FD',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 12,
  },
  swapIcon: { fontSize: 16, color: '#3B5BDB' },
  dropdown: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    backgroundColor: '#FFFFFF', overflow: 'hidden',
    shadowColor: '#3B5BDB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  dropdownName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropdownAddr: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dropdownText: { fontSize: 14, color: '#1E293B' },
  searchBtn: {
    height: 52, backgroundColor: '#3B5BDB',
    borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  searchBtnDisabled: { backgroundColor: '#93A8F4' },
  searchBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
});
