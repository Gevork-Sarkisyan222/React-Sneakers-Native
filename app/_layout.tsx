import { Stack } from 'expo-router';
import '@/app\\global.css';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/redux/store';
import { Provider } from 'react-redux';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GluestackUIProvider mode="light">
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="not-found" />
          </Stack>

          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GluestackUIProvider>
    </Provider>
  );
}
