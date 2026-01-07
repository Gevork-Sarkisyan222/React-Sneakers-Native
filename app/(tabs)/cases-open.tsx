import React, { useEffect, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useGetUser } from '@/hooks/useGetUser';
import { router } from 'expo-router';
import { SneakerCase } from '@/constants/Types';
import { cases } from '@/constants/cases';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { sendToFinance } from '@/utils/finance';

const RenderCaseSkeleton = () => {
  return Array.from({ length: 4 }).map((_, index) => (
    <View key={index} className="bg-white rounded-2xl overflow-hidden shadow-xl mb-5">
      {/* Top stripe (rarity) */}
      <View className="bg-gray-300 px-4 py-2" />

      <View className="flex-row p-4 items-center">
        {/* Image placeholder */}
        <View className="w-24 h-24 rounded-xl bg-gray-200 animate-pulse" />

        <View className="flex-1 ml-4">
          {/* Title */}
          <View className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          {/* Subtitle */}
          <View className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />

          {/* Price + badge */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            <View className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          </View>

          {/* Button */}
          <View className="h-10 bg-gray-300 rounded-xl animate-pulse" />
        </View>
      </View>
    </View>
  ));
};

const CasesOpenPage = () => {
  const { user } = useGetUser({});
  const [buyedCases, setBuyedCases] = React.useState<SneakerCase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const updateCases = useSelector((state: RootState) => state.products.updateCases);

  const fetchBuyedCases = async () => {
    setIsLoading(true);

    try {
      const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/cases');
      setBuyedCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useLayoutEffect(() => {
    fetchBuyedCases();
  }, [updateCases]);

  const getRarityColor = (rarity: SneakerCase['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-300';
      case 'rare':
        return 'bg-blue-600';
      case 'epic':
        return 'bg-purple-500';
      case 'legendary':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRarityText = (rarity: SneakerCase['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'COMMON';
      case 'rare':
        return 'RARE';
      case 'epic':
        return 'EPIC';
      case 'legendary':
        return 'LEGENDARY';
      default:
        return rarity;
    }
  };

  const handleBuyCase = async (item: SneakerCase) => {
    if (!item || !user) return;

    Alert.alert('Confirmation', `Are you sure you want to buy this case for ${item.price} ₽?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Buy',
        onPress: async () => {
          try {
            setIsLoading(true);

            if (user.balance < item.price) return Alert.alert('Error', 'Insufficient funds');

            await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cases', item);

            await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user?.id}`, {
              balance: user?.balance - item.price,
            });

            await sendToFinance(item.price);

            Alert.alert('Success', `${item.title} was successfully purchased for ${item.price} ₽`);

            await fetchBuyedCases();

            await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cases', item);

            await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user?.id}`, {
              balance: user?.balance - item.price,
            });

            await sendToFinance(item.price);

            // Обновляем список купленных кейсов
            await fetchBuyedCases();

            // === Обновляем прогресс квестов по кейсам ===
            try {
              const [dailyRes, weeklyRes] = await Promise.all([
                axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/1'), // daily
                axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2'), // weekly
              ]);

              const daily = dailyRes.data;
              const weekly = weeklyRes.data;

              const currentDailyCases = Number(daily?.buyed_opened_cases ?? 0);
              const currentWeeklyCases = Number(weekly?.buyed_opened_20_cases ?? 0);

              const requests: Promise<any>[] = [];

              // DAILY: buyed_opened_cases (максимум 1)
              if (currentDailyCases < 1) {
                requests.push(
                  axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
                    buyed_opened_cases: currentDailyCases + 1,
                  }),
                );
              }

              // WEEKLY: buyed_opened_20_cases (максимум 20)
              if (currentWeeklyCases < 20) {
                requests.push(
                  axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
                    buyed_opened_20_cases: currentWeeklyCases + 1,
                  }),
                );
              }

              if (requests.length > 0) {
                await Promise.all(requests);
              }
            } catch (err) {
              console.error('Ошибка обновления прогресса кейсов:', err);
            }
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to purchase the case');
          } finally {
            setIsLoading(false);
          }
        },
        style: 'default',
      },
    ]);
  };

  const caseBuyed = (item: SneakerCase) => {
    return buyedCases.find(
      (caseItem) => caseItem.rarity === item.rarity && caseItem.type === item.type,
    );
  };

  const [showFreeCase, setShowFreeCase] = React.useState(false);

  const [timeToOpenFreeCaseMs, setTimeToOpenFreeCaseMs] = React.useState<number>(0); // в мс
  const [countdown, setCountdown] = React.useState<string>('00:00:00');

  const checkFreeCaseDate = async () => {
    try {
      // 1. Получаем текущее время в миллисекундах
      const nowMs = Date.now();

      // 2. Запрашиваем из API ISO‑строку с целью
      const res = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/app-settings/1');
      const isoString: string = res.data.timeToOpenFreeCase;

      // 3. Парсим её в миллисекунды и сохраняем для таймера
      const targetMs = Date.parse(isoString);
      setTimeToOpenFreeCaseMs(targetMs);

      // 4. Сравниваем, если сейчас >= цели — кейс доступен
      if (nowMs >= targetMs) {
        setShowFreeCase(true);
      } else {
        setShowFreeCase(false);
      }
    } catch (error) {
      console.error('Ошибка при проверке даты free case:', error);
      setShowFreeCase(false);
    }
  };

  useEffect(() => {
    checkFreeCaseDate();
    // te guzes hane зависимостн-eren updateCases
  }, [updateCases]);

  const handleAddFreeCase = async (item: SneakerCase) => {
    try {
      // Get all cases
      const res = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/cases');
      const existingCases: SneakerCase[] = res.data;

      // Check: is there already a free case with the same rarity?
      const alreadyExists = existingCases.some(
        (c) => c.rarity === item.rarity && c.type === 'free',
      );

      if (alreadyExists) {
        console.log('This free case has already been added.');
        return;
      }

      // Add the case if it doesn't exist
      await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cases', item);
      console.log('Free case added successfully.');
    } catch (err) {
      console.error('Error while adding free case:', err);
    }
  };

  React.useEffect(() => {
    if (!timeToOpenFreeCaseMs) return;

    const pad = (n: number) => String(n).padStart(2, '0');

    const interval = setInterval(() => {
      const diff = timeToOpenFreeCaseMs - Date.now();
      if (diff <= 0) {
        // время наступило
        setShowFreeCase(true);
        setCountdown('00:00:00');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1000);
        setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeToOpenFreeCaseMs]);

  const commonCase = cases.find((item) => item.rarity === 'common' && item.type === 'free');

  return (
    <LinearGradient colors={['#f0f4f8', '#e2e8f0', '#dbeafe']} style={{ flex: 1 }}>
      <SafeAreaView
        className="flex-1"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              colors={['#338fd4']}
              refreshing={isLoading}
              onRefresh={() => {
                checkFreeCaseDate();
                fetchBuyedCases();
              }}
            />
          }
          className="p-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-[25px] font-bold text-black mb-1 text-center uppercase">
            🔥 Sneakers Cases 🔥
          </Text>
          <Text className="text-black text-center mb-[20px] font-bold">
            Open cases and earn rewards
          </Text>

          {/* Promo banner */}
          <LinearGradient
            colors={['#8E44AD', '#3498DB', '#00FFAA']}
            style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text className="text-white text-xl font-bold mb-2 text-center">FREE CASE</Text>

            <Text className="text-gray-300 text-center mb-4">Open a free case every 24 hours</Text>

            <View className="bg-black/30 rounded-full px-4 py-2 mb-4">
              <Text className="text-amber-300 text-center font-bold">
                {!showFreeCase ? `Next case in: ${countdown}` : 'Case is available!'}
              </Text>
            </View>

            {showFreeCase && commonCase && (
              <TouchableOpacity
                onPress={async () => {
                  await handleAddFreeCase(commonCase);
                  router.push({
                    pathname: '/case/[rarity]',
                    params: { rarity: 'common', type: 'free' },
                  }); // then navigate
                }}
                className="bg-amber-400 rounded-full py-3">
                <Text className="text-gray-900 text-center font-bold">OPEN CASE</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* Список кейсов */}
          <View className="mb-8">
            {isLoading ? (
              <RenderCaseSkeleton />
            ) : (
              cases
                .filter((item) => item.type !== 'free')
                .map((item) => (
                  <View
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-xl mb-5">
                    {/* Полоса редкости */}
                    <View className={`${getRarityColor(item.rarity)} px-4 py-2`}>
                      <Text className="text-center font-bold text-white">
                        {getRarityText(item.rarity)}
                      </Text>
                    </View>

                    {/* Контент кейса */}
                    <View className="flex-row p-4 items-center">
                      {/* Изображение кейса */}
                      <View className="relative">
                        <Image
                          source={{
                            uri: item.imageUrl,
                          }}
                          className="w-24 h-24 rounded-xl"
                          resizeMode="cover"
                        />
                      </View>

                      {/* Информация о кейсе */}
                      <View className="flex-1 ml-4">
                        <Text className="text-lg font-bold text-gray-900">{item.title}</Text>
                        <Text className="text-gray-500 mt-1">
                          Contains {item.itemsInside} pairs
                        </Text>

                        <View className="flex-row justify-between items-center mt-3">
                          <Text className="text-xl font-bold text-gray-900">{item.price} ₽</Text>

                          <View
                            className={` ${caseBuyed(item) ? 'bg-none' : 'bg-green-500'} rounded-full px-3 py-1`}>
                            <Text className="flex-row items-center space-x-1">
                              {caseBuyed(item) ? (
                                <View className="flex-row items-center gap-[5px]">
                                  <Feather name="check" size={16} color="#22c55e" />
                                  {/* green-500 */}
                                  <Text className="text-green-500 text-[12.5px] font-bold">
                                    PURCHASED
                                  </Text>
                                </View>
                              ) : (
                                <Text className="text-white text-xs font-bold">NEW</Text>
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* Кнопка покупки */}
                        <TouchableOpacity
                          onPress={() =>
                            caseBuyed(item)
                              ? router.push({
                                  pathname: '/case/[rarity]',
                                  params: {
                                    rarity: item.rarity.toString(),
                                    type: 'paid',
                                  },
                                })
                              : handleBuyCase(item)
                          }
                          className={`mt-3 ${getRarityColor(item.rarity)} rounded-xl py-3 flex-row items-center justify-center gap-2`}>
                          <Text className="text-white text-center font-bold text-base uppercase">
                            {caseBuyed(item) ? 'OPEN CASE' : 'BUY'}{' '}
                          </Text>

                          {caseBuyed(item) && (
                            <FontAwesome5 name="lock-open" size={17} color="white" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CasesOpenPage;
