// components/BlockedGuard.tsx
import React, { useLayoutEffect } from "react";
import {
  View,
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { BlockedScreen } from "@/components/BlockedScreen";
import { UserInterface } from "@/constants/Types";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useSalesInfo } from "./context/SalesInfoContext";
import { router } from "expo-router";
import Login from "@/app/(tabs)/login";

export function BlockedGuard({ children }: { children: React.ReactNode }) {
  const { productSaleInfo, refresh } = useSalesInfo();
  const [currentUser, setCurrentUser] = React.useState<UserInterface | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUserBlocked, setIsUserBlocked] = React.useState(false);

  // test 555
  const [removeContent, setRemoveContent] = React.useState(false);
  // test 555

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("Token not found");

      const { data } = await axios.get<UserInterface>(
        "https://dcc2e55f63f7f47b.mokky.dev/auth_me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCurrentUser(data);
      setIsUserBlocked(data.isBlocked);
    } catch (error) {
      setCurrentUser(null);
      setIsUserBlocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Выход из аккаунта",
      "Вы действительно хотите выйти?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Выйти",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync("userToken");
              // fetchUser();
              setRemoveContent(true);
              Alert.alert("Выход", "Вы успешно вышли из аккаунта");
            } catch (error) {
              console.error("Ошибка при выходе из аккаунта:", error);
              Alert.alert("Ошибка", "Не удалось выйти из аккаунта");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useLayoutEffect(() => {
    fetchCurrentUser();
    refresh();

    console.log("first");
  }, [isLoading]);

  const timeToUnban = async () => {
    setIsUserBlocked(false);
    await axios.patch(
      `https://dcc2e55f63f7f47b.mokky.dev/users/${currentUser?.id}`,
      {
        isBlocked: false,
        banStart: null,
        banUntil: null,
        blockReason: null,
        blockedBy: null,
      }
    );
  };

  useLayoutEffect(() => {
    if (!currentUser?.banUntil) return;

    const banDate = new Date(currentUser.banUntil);
    const today = new Date();

    // обнуляем время
    banDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (banDate <= today) {
      timeToUnban();
    }
  }, [isLoading]);

  if (isUserBlocked) {
    return (
      <BlockedScreen
        adminName={currentUser?.blockedBy ?? "Н/Д"}
        reason={currentUser?.blockReason ?? undefined}
        banUntil={currentUser?.banUntil ?? undefined}
      />
    );
  }

  const isAdmin =
    currentUser?.position === "admin" || currentUser?.position === "superadmin";

  if (
    !isAdmin && // не админ
    productSaleInfo.isStoreOpen === false && // магазин закрыт
    currentUser?.position === "user" // и это обычный пользователь
  ) {
    return (
      !removeContent && (
        <View className="flex-1 justify-center items-center bg-white px-6">
          <Image
            source={{
              uri: "https://www.pngplay.com/wp-content/uploads/9/Maintenance-PNG-Pic-Background.png",
            }}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-center text-gray-800 mt-6">
            Мы на обновлении
          </Text>
          <Text className="text-base text-center text-gray-600 mt-2">
            Магазин временно недоступен. Мы скоро вернёмся!
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://t.me/gevork_sarkisyan")}
            className="bg-blue-600 px-4 py-2 rounded-xl mt-4"
          >
            <Text className="text-white text-base font-semibold text-center">
              Узнать подробности
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-blue-600 px-4 py-2 rounded-xl mt-4"
          >
            <Text className="text-white text-base font-semibold text-center">
              Выйти из аккаунта
            </Text>
          </TouchableOpacity>
        </View>
      )
    );
  }

  if (!isAdmin && productSaleInfo.isStoreOpen === false) {
    return <Login closedStore={true} setRemoveContent={setRemoveContent} />;
  }

  return <>{children}</>;
}
