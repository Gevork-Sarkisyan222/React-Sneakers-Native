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
      Alert.alert('Error', 'Enter your first and last name');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Enter a valid email');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Enter a Russian phone number in the format +7XXXXXXXXXX');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Enter an address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
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
      Alert.alert('Success', 'You have successfully registered');
      router.push('/');
    } catch (error) {
      console.error('REGISTRATION FAILED:', error);
      Alert.alert('Error', 'Registration error');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white px-6 py-8">
      <Text className="text-3xl font-bold text-center mt-5">Sign up for</Text>
      <Text className="text-blue-500 text-3xl font-bold text-center mb-2">Native Sneakers</Text>
      <Text className="text-center text-[#333] text-[13px] mb-8">
        This is a demo/training simulation. Do not enter real data. Data is stored in a test
        database.
      </Text>

      <Text className="text-sm font-medium mb-2">First name (not real)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Your first name"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-sm font-medium mb-2">Last name (not real)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Your last name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text className="text-sm font-medium mb-2">Email (Demo for testing and practice)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="demo@example.com (Demo)"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-sm font-medium mb-2">Password (Demo, don’t use a real one)</Text>
      <View className="relative mb-6">
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Create a password"
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

      <Text className="text-sm font-medium mb-2">Phone (Demo for testing and practice)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="+7XXXXXXXXXX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={12}
      />

      <Text className="text-sm font-medium mb-2">Address (Demo for testing and practice)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Home address (not real)"
        value={address}
        onChangeText={setAddress}
      />

      <TouchableOpacity className="bg-blue-500 rounded-lg py-3 mb-6" onPress={handleRegister}>
        <Text className="text-white text-center font-semibold">Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mb-[50px]" onPress={() => router.push('/login')}>
        <Text className="text-blue-500 text-center">Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
