import { UserInterface } from '@/constants/Types';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Props = {};

export default function Login({}: Props) {
  const router = useRouter();

  // СТЕЙТЫ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  console.log(email, password);

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/auth', {
        email: email.trim(),
        password: password.trim(),
      });

      const { token, data: userData } = response.data;

      // Сохраняем токен и ID пользователя (если нужно)
      await SecureStore.setItemAsync('userToken', token);

      Alert.alert('Успех', 'Вы успешно вошли в аккаунт');
      router.push('/');
    } catch (error) {
      console.error('Не удалось выполнить вход:', error);
      Alert.alert('Ошибка', 'Неверный email или пароль');
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
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

      <TouchableOpacity className="bg-blue-500 rounded-lg py-3 mb-6" onPress={handleLogin}>
        <Text className="text-white text-center font-semibold">Войти</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text className="text-blue-500 text-center">Нет аккаунта? Зарегистрироваться</Text>
      </TouchableOpacity>
    </View>
  );
}
