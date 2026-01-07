import React, { useEffect, useRef } from 'react';
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
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useGetUser } from '@/hooks/useGetUser';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function Profile() {
  // const [user, setUser] = React.useState<UserInterface | null>(null);
  // const [isLoading, setIsLoading] = React.useState(false);
  const { user, isLoading, fetchUser } = useGetUser({ pathname: 'profile' });
  const router = useRouter();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');

  // const fetchUser = async () => {
  //   setIsLoading(true);
  //   try {
  //     const token = await SecureStore.getItemAsync('userToken');
  //     if (!token) throw new Error('Token not found');

  //     const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/auth_me', {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     setUser(data);
  //   } catch (error) {
  //     // 👇👇👇👇 МОЖЕТ ПРИГОДИТЬСЯ krna petq qal not delete down НЕ УДАЛИ КОММЕНТАРИИ MUST HAVE >>>>>>>>> 👇👇👇

  //     // Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
  //     setUser(null);
  //     console.error('Ошибка при загрузке пользователя:', error);
  //     await SecureStore.deleteItemAsync('userToken');
  //     router.replace('/login');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchUser();
  //   }, []),
  // );

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('userToken');
              fetchUser();
              Alert.alert('Logged out', 'You have successfully logged out');
              router.replace('/login');
            } catch (error) {
              console.error('Error while logging out:', error);
              Alert.alert('Error', 'Failed to log out');
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
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
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
      <SafeAreaView className="flex-1 bg-gray-100">
        <ScrollView
          // this property centers the content
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 16, // instead of p-4 on SafeAreaView
          }}
          refreshControl={
            <RefreshControl colors={['#338fd4']} refreshing={isLoading} onRefresh={fetchUser} />
          }>
          {/* Avatar skeleton */}
          <View className="items-center mb-6">
            <SkeletonBlock style={styles.avatarSkeleton} />
            <SkeletonBlock style={styles.nameSkeleton} />
            <SkeletonBlock style={styles.roleSkeleton} />
          </View>

          {/* Info skeleton */}
          <View className="bg-white p-4 rounded-2xl shadow-lg mb-6">
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.infoLine} />
            <SkeletonBlock style={styles.balanceSkeleton} />
          </View>

          {/* Logout button skeleton */}
          <View className="items-center">
            <SkeletonBlock style={styles.logoutSkeleton} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // функция для Пополнение баланса
  const onReplenish = async () => {
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');

    if (cleanCardNumber.length !== 16) {
      Alert.alert('ERROR', 'The card number must contain exactly 16 digits');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      Alert.alert('ERROR', 'Enter a valid amount');
      return;
    }
    // you can add card number validation here
    try {
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user.id}`, {
        balance: Number(user.balance) + Number(amount),
      });
      Alert.alert('SUCCESS', 'Balance topped up successfully');
      setAmount('');
      setCardNumber('');
      setModalVisible(false);
      fetchUser();
    } catch (error) {
      console.error('Error while topping up balance:', error);
      Alert.alert('ERROR', 'Failed to top up balance');
    }
  };

  return (
    <>
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
            <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
              <Text className="text-amber-900 font-semibold">Demo / training mode</Text>
              <Text className="text-amber-800 text-sm mt-1">
                The app is running in demo mode. Data is used only for testing functionality and is
                stored in a test database.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600">Email</Text>
              <Text className="text-gray-800 font-medium">{user.email}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600">Phone</Text>
              <Text className="text-gray-800 font-medium">{user.phone}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600">Address</Text>
              <Text className="text-gray-800 font-medium">{user.address}</Text>
            </View>

            <View className="mt-6 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-600">Balance</Text>
                <Text className="text-xl font-bold text-blue-500">
                  {user.balance.toLocaleString()} ₽
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-green-100 px-4 py-2 rounded-xl flex-row justify-center gap-[10px] items-center">
                <FontAwesome name="credit-card" size={20} color="text-green-800" />
                <Text className="text-green-800 font-medium text-center">
                  Top up balance{'\n'}(DEMO)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Кнопка перехода в админ панель nav */}
          {(user.position === 'admin' ||
            user.position === 'superadmin' ||
            user.position === 'owner') && (
            <Pressable
              onPress={() => router.push('/admin-panel')}
              className="bg-white rounded-xl py-3 items-center shadow-md mb-4 flex-row justify-center gap-2">
              <Text className="text-blue-500 font-semibold text-base">Go to admin panel</Text>
              <AntDesign name="arrowright" size={24} color="#338fd4" />
            </Pressable>
          )}

          {/* Logout button */}
          <Pressable
            onPress={handleLogout}
            className="bg-white rounded-xl py-3 items-center shadow-md flex-row justify-center gap-2">
            <Text className="text-blue-500 font-semibold text-base">Log out</Text>
            <MaterialIcons name="exit-to-app" size={24} color="#338fd4" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Модалка пополнения */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-11/12 bg-white rounded-2xl p-6">
            <Text className="text-xl font-bold mb-4">Top up balance (DEMO)</Text>
            <Text className="text-sm mb-1">Amount (₽)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text className="text-sm mb-1">Card number (DEMO)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="XXXX XXXX XXXX XXXX"
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={(text) => {
                // 1) Remove everything except digits
                const digitsOnly = text.replace(/\D/g, '');
                // 2) Limit to 16 digits
                const limitedDigits = digitsOnly.slice(0, 16);
                // 3) Format: every 4 digits + space
                const formatted = limitedDigits.replace(/(.{4})/g, '$1 ').trim();
                setCardNumber(formatted);
              }}
              // 16 digits + 3 spaces = 19 characters
              maxLength={19}
            />
            <Text className="text-xs text-gray-500 mb-4">
              Demo mode. Real payments are not supported. Card data is not saved. The card number is
              used only for simulation and is not sent to the server.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity
                className="mr-4 p-2"
                onPress={() => {
                  setModalVisible(false);
                  setAmount('');
                  setCardNumber('');
                }}>
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="p-2" onPress={onReplenish}>
                <Text className="text-blue-500 font-semibold">Top up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
