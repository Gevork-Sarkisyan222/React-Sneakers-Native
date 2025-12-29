import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {};

export default function Register({}: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+7');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ФУНКЦИЯ ВАЛИДАЦИИ EMAIL
  const validateEmail = (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
  };

  // ФУНКЦИЯ ВАЛИДАЦИИ РОССИЙСКОГО ТЕЛЕФОНА +7...
  const validatePhone = (value: string) => {
    const pattern = /^\+7\d{10}$/;
    return pattern.test(value.replace(/[^\d+]/g, ''));
  };

  const handleRegister = async () => {
    // ПРОВЕРКА ПОЛЕЙ
    if (!name.trim() || !lastName.trim()) {
      Alert.alert('Ошибка', 'Введите имя и фамилию');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Ошибка', 'Введите российский номер в формате +7XXXXXXXXXX');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Ошибка', 'Введите адрес');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    const newUser = {
      name,
      lastName,
      avatarUri:
        avatarUri ||
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQADjfoADAlJPrsl_hiiOMeE-FBor-i6hEAVg&s',
      email,
      phone,
      address,
      password,
      balance: 0,
      position: 'user',
    };

    try {
      const response = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/register', newUser);
      const { token } = response.data;

      await SecureStore.setItemAsync('userToken', token);
      Alert.alert('Успех', 'Вы успешно зарегистрировались');
      router.push('/');
    } catch (error) {
      console.error('НЕ МОГЛИ ЗАРЕГИСТРИРОВАТЬСЯ:', error);
      Alert.alert('Ошибка', 'Ошибка при регистрации');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white px-6 py-8">
      <Text className="text-3xl font-bold text-center mt-5">Регистрация в</Text>
      <Text className="text-blue-500 text-3xl font-bold text-center mb-2">Native Sneakers</Text>
      <Text className="text-center text-[#333] text-[13px] mb-8">
        Это демо/учебная симуляция. Не вводите реальные данные. Данные сохраняются в тестовой базе.
      </Text>

      <Text className="text-sm font-medium mb-2">Имя (не реальный)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Ваше имя"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-sm font-medium mb-2">Фамилия (не реальный)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Ваша фамилия"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text className="text-sm font-medium mb-2">Email (Demo для теста и практики)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="demo@example.com (Demo)"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-sm font-medium mb-2">Пароль (Demo, не используйте реальный)</Text>
      <View className="relative mb-6">
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Придумайте пароль"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          className="absolute right-3 top-3"
          onPress={() => setShowPassword((prev) => !prev)}>
          <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={24} />
        </TouchableOpacity>
      </View>

      <Text className="text-sm font-medium mb-2">Avatar URL</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="https://..."
        value={avatarUri}
        onChangeText={setAvatarUri}
      />

      <Text className="text-sm font-medium mb-2">Телефон (Demo для теста и практики)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="+7XXXXXXXXXX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={12}
      />

      <Text className="text-sm font-medium mb-2">Адрес (Demo для теста и практики)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Адрес проживания (не реальный)"
        value={address}
        onChangeText={setAddress}
      />

      <TouchableOpacity className="bg-blue-500 rounded-lg py-3 mb-6" onPress={handleRegister}>
        <Text className="text-white text-center font-semibold">Зарегистрироваться</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-[50px]" onPress={() => router.push('/login')}>
        <Text className="text-blue-500 text-center">Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
