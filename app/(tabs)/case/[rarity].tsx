import { CartProduct, CaseItem, SneakerCase } from '@/constants/Types';
import { useGetUser } from '@/hooks/useGetUser';
import { setRemoveAllMarks, setUpdateCases } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Animated,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

const ITEM_MARGIN = 20; // отступ справа

interface TCarouselProps<CaseItem> {
  // other properties...
  panGestureHandlerProps?: {
    activeOffsetX: [number, number];
    failOffsetY: [number, number];
  };
}

export default function CasePage() {
  const { user } = useGetUser({});
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);
  const updateCases = useSelector((state: RootState) => state.products.updateCases);
  const dispatch = useDispatch();
  const { rarity, type } = useLocalSearchParams();
  const [currentCase, setCurrentCase] = React.useState<SneakerCase | null>(null);
  const [isLoadingToRedirect, setIsLoadingToRedirect] = React.useState(false);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [caseItems, setCaseItems] = React.useState<CaseItem[]>([]);
  // const [isScrollEnabled, setIsScrollEnabled] = React.useState(false);
  const [winnedItem, setWinnedItem] = React.useState<CaseItem | null>(null);
  const [resultModal, setResultModal] = React.useState<boolean>(false);

  const DUMMY_IMAGE = currentCase?.backgroundImage;

  const carouselRef = useRef<any | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (resultModal) {
      // Анимация при открытии
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Сброс анимации при закрытии
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [resultModal]);

  const fetchCurrentCase = async () => {
    const res = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/cases');

    const findRes = res.data.find(
      (item: SneakerCase) => item.rarity === rarity && item.type === type,
    );

    setCurrentCase(findRes);
    setCaseItems(findRes.items);
  };

  useEffect(() => {
    fetchCurrentCase();

    return () => {
      setCurrentCase(null);
    };
  }, [rarity, type]);

  useEffect(() => {
    // если ещё ничего не выиграли — выходим
    if (!winnedItem) return;

    // считаем только редкие предметы
    if (winnedItem.item_rarity !== 'rare') return;

    const updateRareWins = async () => {
      try {
        // берём weekly-задачу (id: 2)
        const { data: weekly } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2');

        const currentRareWins = Number(weekly?.win_3_rare_in_cases ?? 0);

        // если уже 3 или больше — больше не увеличиваем
        if (currentRareWins >= 3) return;

        const nextRareWins = Math.min(3, currentRareWins + 1);

        await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
          win_3_rare_in_cases: nextRareWins,
        });
      } catch (err) {
        console.error('Ошибка обновления win_3_rare_in_cases:', err);
      }
    };

    updateRareWins();
  }, [winnedItem]);

  if (!currentCase || isLoadingToRedirect)
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
        <ActivityIndicator size="large" color="#FFD700" />
        {/* Золотистый цвет для контраста и стиля */}
        <Text
          style={{
            color: '#FFD700',
            marginTop: 12,
            fontWeight: '600',
            fontSize: 18,
          }}>
          Loading...
        </Text>
      </View>
    );

  const getRarityBgColor = (rarity: SneakerCase['rarity']) => {
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

  const getRarityTextColor = (rarity: SneakerCase['rarity']): string => {
    switch (rarity) {
      case 'common':
        return '#D1D5DB'; // gray-300
      case 'rare':
        return '#2563EB'; // blue-600
      case 'epic':
        return '#A855F7'; // purple-500
      case 'legendary':
        return '#F59E0B'; // yellow-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getArrowColor = (rarity: SneakerCase['rarity']): string => {
    switch (rarity) {
      case 'common':
        return '#D1D5DB'; // gray-300
      case 'rare':
        return 'white';
      case 'epic':
        return 'white';
      case 'legendary':
        return 'white';
      default:
        return '#6B7280';
    }
  };

  const getWinnedItemName = (rarity: SneakerCase['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'Common';
      case 'rare':
        return 'Rare';
      case 'epic':
        return 'Epic';
      case 'legendary':
        return 'Legendary';
      default:
        return 'Common';
    }
  };

  const spinCarousel = (targetIndex: number, steps = 30, totalDuration = 4000) => {
    if (!carouselRef.current) return;

    const startIndex = targetIndex - steps;
    const delays: number[] = [];

    // Генерируем массив задержек с эффектом ускорения → замедления
    const base = 1.05;
    let total = 0;
    for (let i = 0; i < steps; i++) {
      const delay = Math.pow(base, i) * 10;
      delays.push(delay);
      total += delay;
    }

    // Нормализуем так, чтобы сумма всех задержек ≈ totalDuration
    const factor = totalDuration / total;
    const finalDelays = delays.map((d) => d * factor);

    // Запускаем каждую итерацию с нарастающей задержкой
    finalDelays.reduce((acc, delay, i) => {
      setTimeout(() => {
        carouselRef.current?.scrollTo({
          index: startIndex + i + 1,
          animated: true,
        });
      }, acc);
      return acc + delay;
    }, 0);
  };

  const loops = 5;

  const handleOpenCase = async () => {
    if (!carouselRef.current || caseItems.length === 0) return;
    setIsSpinning(true);

    const winningIndex = Math.floor(Math.random() * caseItems.length);
    const loops = 5;
    const steps = loops * caseItems.length;
    const finalIndex = steps + winningIndex;
    const duration = 4000;

    // 1) Запускаем анимацию прокрутки
    spinCarousel(finalIndex, steps, duration);

    // 2) Через duration мс перебрасываем ещё на +1 карточку
    setTimeout(() => {
      carouselRef.current?.scrollTo({
        index: finalIndex + 1,
        animated: true,
      });
    }, duration + 50);

    const wonItem = caseItems[finalIndex % caseItems.length];
    setWinnedItem(wonItem);

    try {
      if (wonItem?.item_type === 'shoe') {
        await axios.post<CartProduct>('https://dcc2e55f63f7f47b.mokky.dev/cart', {
          id: wonItem.item_id,
          title: wonItem.item_title,
          imageUri: wonItem.item_imageUrl,
          price: String(0),
        });

        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Congratulations!',
            text2: 'The won item has been added to your cart 👟',
            position: 'top', // or "top"
            visibilityTime: 3000, // 3 seconds
          });
        }, duration + 300);

        dispatch(setRemoveAllMarks(!removeAllMarks));
      }

      if (wonItem?.item_type === 'money') {
        if (!user) return;

        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user?.id}`, {
          balance: user?.balance + wonItem.item_price,
        });

        Toast.show({
          type: 'success',
          text1: 'Congratulations!',
          text2: `Your balance has been topped up by ${wonItem.item_price}₽`,
          position: 'top', // or "top"
          visibilityTime: 3000, // 3 seconds
        });
      }

      if (wonItem?.item_type === 'empty') {
        console.log('К сожалению вы нечего не выиграли');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
      console.error(err);
    }

    // if free case

    if (type === 'free') {
      // Получаем текущий момент
      const now = new Date();

      // Добавляем 24 часа (24 * 60 * 60 * 1000 мс)
      const plus24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Приводим к ISO‑строке (например, '2025-07-22T18:44:08.152Z')
      const timeToOpenFreeCase = plus24h.toISOString();

      // Делаем PATCH-запрос
      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/app-settings/1', {
        timeToOpenFreeCase,
      });
    }
    // end if free case

    // 3) Показываем модальное окно после полного завершения анимации
    setTimeout(() => {
      setResultModal(true);
    }, duration + 300); // Добавляем небольшую задержку для плавности
  };

  const CASES_DATA = Array(loops * caseItems.length + 1)
    .fill(null)
    .map((_, i) => caseItems[i % caseItems.length]);

  const onCloseResultModal = async () => {
    setIsLoadingToRedirect(true);
    setResultModal(false);
    setWinnedItem(null);

    // Перебрасываем user на /cases-open после открытия кейса потом он если захочет еще купит но после одного раза нет
    await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/cases/${currentCase.id}`);
    dispatch(setUpdateCases(!updateCases));
    router.push('/cases-open');

    setIsSpinning(false);

    setIsLoadingToRedirect(false);
  };

  const panGestureHandlerProps: any = {
    activeOffsetX: [-10, 10],
    failOffsetY: [-10, 10],
  };

  return (
    <>
      {resultModal && (
        <Animated.View
          className="absolute inset-0 z-[1000] justify-center items-center"
          style={{
            elevation: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            opacity: fadeAnim,
          }}>
          {/* Затемняющий фон */}
          <Pressable className="absolute inset-0" onPress={onCloseResultModal} />

          {/* Контент модального окна с анимацией */}
          <Animated.View
            className="w-[90%] max-w-[400px] bg-white rounded-2xl overflow-hidden z-[1001]"
            style={{
              elevation: 1001,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }}>
            {/* Изображение */}
            <Image
              source={{ uri: winnedItem?.item_imageUrl || DUMMY_IMAGE }}
              className="w-full h-48"
              resizeMode="cover"
            />

            {/* Контент */}
            <View className="p-6">
              <Text className="text-xl font-bold mb-2 text-gray-800">
                {winnedItem?.item_type === 'empty'
                  ? 'Unfortunately, you didn’t win anything'
                  : '🎉 You got it!'}
              </Text>

              <Text
                className={`text-lg font-semibold text-gray-700 ${
                  winnedItem?.item_type === 'shoe' ? 'mb-1' : 'mb-4'
                }`}>
                {winnedItem?.item_type === 'empty'
                  ? 'Try again'
                  : winnedItem?.item_title || 'Unknown item'}
              </Text>

              {winnedItem?.item_type === 'shoe' && (
                <Text className="text-lg font-semibold mb-4 text-gray-700">
                  Valued at {winnedItem?.item_price} ₽
                </Text>
              )}

              {/* Rarity */}
              {winnedItem?.item_type !== 'empty' && winnedItem?.item_type !== 'money' && (
                <View
                  className={`self-start px-3 py-1 rounded-full mb-6 ${getRarityBgColor(
                    winnedItem?.item_rarity ?? 'common',
                  )}`}>
                  <Text
                    className={`text-sm font-medium ${
                      winnedItem?.item_rarity === 'common' ? 'text-black' : 'text-white'
                    }`}>
                    {getWinnedItemName(winnedItem?.item_rarity ?? 'common')}
                  </Text>
                </View>
              )}

              {/* Кнопка */}
              <Pressable
                className={`rounded-lg py-3 ${getRarityBgColor(currentCase.rarity)}`}
                onPress={onCloseResultModal}>
                <Text
                  className={`text-center font-semibold text-base ${
                    currentCase.rarity === 'common' ? 'text-black' : 'text-white'
                  }`}>
                  Confirm & Close
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      <ImageBackground source={{ uri: DUMMY_IMAGE }} blurRadius={15} className="flex-1">
        <View className="absolute inset-0 bg-beige-200/60 items-center pt-[75px]">
          {/* Header */}
          <Text className="text-white text-[23px] font-semibold">
            Open{' '}
            <Text
              className={`font-extrabold tracking-wide`}
              style={{
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
                color: getRarityTextColor(currentCase.rarity),
              }}>
              {currentCase.type === 'free' ? 'Free Case' : currentCase.title}
            </Text>
          </Text>

          <Text className="text-white/70 text-base underline mt-1">Native Sneakers Cases</Text>

          <Text className="text-white/70 text-base mt-1">This case can only be opened once</Text>

          {/* Carousel */}
          <View className="w-full mt-[150px] justify-center">
            <FontAwesome
              name="long-arrow-down"
              size={100}
              // color="#2563EB"
              color={getArrowColor(currentCase.rarity)}
              style={{
                position: 'absolute',
                top: -100,
                left: width / 2 - 120, // size/2 для центровки
                height: CARD_WIDTH * 1.2 + 10,
              }}
            />

            <Carousel
              ref={carouselRef}
              loop
              width={width} // ширина всей области карусели
              height={CARD_WIDTH * 1.3}
              data={CASES_DATA}
              autoPlay={false}
              scrollAnimationDuration={500}
              pagingEnabled={false} // отключаем, чтобы можно было плавно крутить
              mode="horizontal-stack"
              modeConfig={{
                snapDirection: 'left',
                stackInterval: 30, // расстояние между карточками
                scaleInterval: 0.08, // эффект масштаба
              }}
              enabled={false} // Отключает все жесты
              panGestureHandlerProps={panGestureHandlerProps as any}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_WIDTH * 1.3,
                    borderRadius: 16,
                    marginLeft: ITEM_MARGIN,
                    overflow: 'hidden',
                    backgroundColor: '#eee',
                  }}>
                  <Image
                    source={{ uri: item.item_imageUrl }}
                    style={{ width: '100%', height: '80%' }}
                    resizeMode="cover"
                  />
                  <View className={`h-4 ${getRarityBgColor(item.item_rarity)}`} />
                </View>
              )}
            />
          </View>

          {/* Open Case Button */}
          <TouchableOpacity
            onPress={isSpinning ? undefined : handleOpenCase}
            className={`absolute bottom-16 ${getRarityBgColor(currentCase.rarity)} px-16 py-4 rounded-full shadow-lg`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}>
            <Text
              className={`text-lg font-extrabold tracking-wider uppercase ${
                currentCase.rarity === 'common' ? 'text-black' : 'text-white'
              }`}
              style={{
                textShadowColor:
                  currentCase.rarity === 'common' ? 'transparent' : 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}>
              {isSpinning ? 'Opening...' : 'Open'}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </>
  );
}
