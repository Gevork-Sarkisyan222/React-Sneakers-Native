import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {};

export default function Register({}: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    const newUser = {
      id: Date.now(),
      name,
      lastName,
      avatarUri,
      email,
      phone,
      address,
      password,
    };
    // здесь логика сохранения newUser в вашу базу
    console.log('Registered:', newUser);
    router.push('/login');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white px-6 py-8">
      <Text className="text-3xl font-bold text-center mt-[20px]">Регистрация в</Text>
      <Text className="text-blue-500 inline text-3xl font-bold text-center mb-8">
        Native Sneakers
      </Text>

      <Text className="text-sm font-medium mb-2">Имя</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Ваше имя"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-sm font-medium mb-2">Фамилия</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Ваша фамилия"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text className="text-sm font-medium mb-2">Пароль</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-6"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text className="text-sm font-medium mb-2">Avatar URL</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="https://..."
        value={avatarUri}
        onChangeText={setAvatarUri}
      />

      <Text className="text-sm font-medium mb-2">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-sm font-medium mb-2">Телефон</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="+7 900 123 45 67"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text className="text-sm font-medium mb-2">Адрес</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="ул. Ленина, д. 25, Москва"
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
