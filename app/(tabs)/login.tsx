import { UserInterface } from "@/constants/Types";
import axios from "axios";
import * as Updates from "expo-updates";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";

type Props = {
  closedStore?: boolean;
  setRemoveContent?: (removeContent: boolean) => void;
};

export default function Login({ closedStore, setRemoveContent }: Props) {
  const router = useRouter();

  // СТЕЙТЫ
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  console.log(email, password);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://dcc2e55f63f7f47b.mokky.dev/auth",
        {
          email: email.trim(),
          password: password.trim(),
        }
      );

      const { token, data: userData } = response.data;

      // Сохраняем токен и ID пользователя (если нужно)
      await SecureStore.setItemAsync("userToken", token);

      closedStore && setRemoveContent && setRemoveContent(false);

      Alert.alert("Успех", "Вы успешно вошли в аккаунт");
      router.push("/");
      closedStore && (await Updates.reloadAsync());
    } catch (error) {
      console.error("Не удалось выполнить вход:", error);
      Alert.alert("Ошибка", "Неверный email или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
    }, [])
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Пожалуйста, подождите...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Image
        resizeMode="contain"
        source={require("../../assets/images/sneakers.png")}
        className="w-[90px] h-[90px] mx-auto mb-8"
      />
      {closedStore && (
        <Text className="text-2xl font-bold text-center mb-2 whitespace-nowrap text-[#b10000] underline">
          Магазин в приложении временно закрыт авторизация медленная ожидайте
        </Text>
      )}
      <Text className="text-3xl font-bold text-center mb-8 whitespace-nowrap">
        Вход в <Text className="text-blue-500">Native Sneakers</Text>
      </Text>

      <Text className="text-sm font-medium mb-2">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-sm font-medium mb-2">Пароль</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-6"
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="bg-blue-500 rounded-lg py-3 mb-6"
        onPress={handleLogin}
      >
        <Text className="text-white text-center font-semibold">Войти</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text className="text-blue-500 text-center">
          Нет аккаунта? Зарегистрироваться
        </Text>
      </TouchableOpacity>
    </View>
  );
}
