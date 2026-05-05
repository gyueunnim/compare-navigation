import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: '내비 비교', headerShown: false }} />
        <Stack.Screen
          name="results"
          options={{ title: '경로 비교', headerBackTitle: '검색' }}
        />
      </Stack>
    </>
  );
}
