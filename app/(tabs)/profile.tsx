import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  RefreshControl,
  Animated,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { UserInterface } from '@/constants/Types';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useRouter } from 'expo-router';

export default function Profile() {
  const [user, setUser] = React.useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) throw new Error('Token not found');

      const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/auth_me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
    } catch (error) {
      // 👇👇👇👇 МОЖЕТ ПРИГОДИТЬСЯ krna petq qal not delete down НЕ УДАЛИ КОММЕНТАРИИ MUST HAVE >>>>>>>>> 👇👇👇
      // console.error('Ошибка при загрузке пользователя:', error);
      // Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
      // await SecureStore.deleteItemAsync('userToken');
      router.replace('/login'); // редирект на логин
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы действительно хотите выйти?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('userToken');
              Alert.alert('Выход', 'Вы успешно вышли из аккаунта');
              router.replace('/login');
            } catch (error) {
              console.error('Ошибка при выходе из аккаунта:', error);
              Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // Animated skeleton opacity
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  // Скелетон для одного блока
  const SkeletonBlock = ({ style }: { style: any }) => (
    <Animated.View style={[style, { opacity, backgroundColor: '#E0E0E0' }]} />
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 p-4">
        <ScrollView
          refreshControl={
            <RefreshControl colors={['#338fd4']} refreshing={isLoading} onRefresh={fetchUser} />
          }>
          {/* Скелетон аватара */}
          <View className="items-center mb-6">
            <SkeletonBlock style={styles.avatarSkeleton} />
            <SkeletonBlock style={styles.nameSkeleton} />
            <SkeletonBlock style={styles.roleSkeleton} />
          </View>

          {/* Скелетон информации */}
          <View className="bg-white p-4 rounded-2xl shadow-lg mb-6">
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.balanceSkeleton} />
          </View>

          {/* Скелетон кнопки выхода */}
          <SkeletonBlock style={styles.logoutSkeleton} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchUser} colors={['#338fd4']} />
        }>
        {/* Аватар и Имя */}
        <View className="items-center mb-6">
          <Image source={{ uri: user.avatarUri }} className="w-24 h-24 rounded-full mb-3" />
          <Text className="text-2xl font-bold text-gray-900">
            {user.name} {user.lastName}
          </Text>
          {user.position !== 'user' && (
            <View className="bg-blue-100 px-3 py-1 rounded-full mt-1">
              <Text className="text-blue-800 font-medium text-sm">
                {user.position.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Информация */}
        <View className="bg-white p-4 rounded-2xl shadow-lg mb-6">
          <View className="mb-4">
            <Text className="text-gray-600">Email</Text>
            <Text className="text-gray-800 font-medium">{user.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600">Телефон</Text>
            <Text className="text-gray-800 font-medium">{user.phone}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600">Адрес</Text>
            <Text className="text-gray-800 font-medium">{user.address}</Text>
          </View>

          <View className="mt-6 flex-row justify-between items-center">
            <View>
              <Text className="text-gray-600">Баланс</Text>
              <Text className="text-xl font-bold text-blue-500">
                {user.balance.toLocaleString()} ₽
              </Text>
            </View>
            <View className="bg-green-100 px-4 py-2 rounded-xl">
              <Text className="text-green-800 font-medium">Пополнить</Text>
            </View>
          </View>
        </View>

        {/* Кнопка выхода */}
        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-xl py-3 items-center shadow-md">
          <Text className="text-blue-500 font-semibold text-base">Выйти из аккаунта</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  nameSkeleton: {
    width: 140,
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  roleSkeleton: {
    width: 80,
    height: 16,
    borderRadius: 8,
  },
  infoLine: {
    width: '100%',
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  balanceSkeleton: {
    width: 100,
    height: 24,
    borderRadius: 4,
    marginTop: 8,
  },
  logoutSkeleton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    marginTop: 16,
  },
});
