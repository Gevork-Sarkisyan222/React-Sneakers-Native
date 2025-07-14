import React from "react";
import { Stack } from "expo-router";
import "@/app/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { SalesInfoProvider } from "@/components/context/SalesInfoContext";
import Toast from "react-native-toast-message";
import { View } from "react-native";
import { BlockedGuard } from "@/components/BlockedGuard";

export default function RootLayout() {
  return (
    <BlockedGuard>
      <SalesInfoProvider>
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

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999999,
            elevation: 999999,
          }}
        >
          <Toast />
        </View>
      </SalesInfoProvider>
    </BlockedGuard>
  );
}
