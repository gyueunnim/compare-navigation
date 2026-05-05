import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  async function handleCurrentLocation() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '현재 위치 사용을 위해 위치 권한을 허용해주세요.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const addr = [geo.city, geo.district, geo.street].filter(Boolean).join(' ');
      setOrigin(addr || `${loc.coords.latitude.toFixed(4)},${loc.coords.longitude.toFixed(4)}`);
    } catch {
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSearch() {
    if (!origin.trim()) {
      Alert.alert('입력 필요', '출발지를 입력해주세요.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('입력 필요', '목적지를 입력해주세요.');
      return;
    }

    try {
      const [origins, dests] = await Promise.all([
        geocodeAddress(origin.trim()),
        geocodeAddress(destination.trim()),
      ]);

      if (!origins.length) {
        Alert.alert('검색 실패', `출발지 "${origin}"를 찾을 수 없습니다.`);
        return;
      }
      if (!dests.length) {
        Alert.alert('검색 실패', `목적지 "${destination}"를 찾을 수 없습니다.`);
        return;
      }

      router.push({
        pathname: '/results',
        params: {
          startLat: origins[0].lat,
          startLng: origins[0].lng,
          endLat: dests[0].lat,
          endLng: dests[0].lng,
          startAddr: origins[0].address,
          endAddr: dests[0].address,
        },
      });
    } catch {
      Alert.alert('오류', '주소 검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>내비 비교</Text>
          <Text style={styles.subtitle}>세 가지 길안내를 한눈에 비교하세요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>출발지</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="출발지 주소 입력"
                placeholderTextColor="#AAAAAA"
                value={origin}
                onChangeText={setOrigin}
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={handleCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#555" />
                ) : (
                  <Text style={styles.locationBtnText}>현위치</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>목적지</Text>
            <TextInput
              style={styles.inputFull}
              placeholder="목적지 주소 입력"
              placeholderTextColor="#AAAAAA"
              value={destination}
              onChangeText={setDestination}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchBtnText}>경로 비교하기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          각 내비게이션 서비스의 경로 계산 방식에 따라 실제 결과는 차이가 있을 수 있습니다.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
  },
  form: {
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  inputFull: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  locationBtn: {
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    minWidth: 64,
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  searchBtn: {
    height: 52,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 16,
  },
});
