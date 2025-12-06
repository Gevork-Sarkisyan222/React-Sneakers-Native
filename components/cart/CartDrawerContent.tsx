import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, Text, View } from 'react-native';
import { DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';

import CartCard from './CartCard';
import { ScrollView } from 'react-native';
import axios from 'axios';
import { Product } from '@/constants/Types';
import Toast from 'react-native-toast-message';
import AntDesign from '@expo/vector-icons/AntDesign';
import { setRemoveAllMarks } from '@/redux/slices/products.slice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetUser } from '@/hooks/useGetUser';
import { sendToFinance } from '@/utils/finance';

interface Props {
  cartProducts: Product[];
  setCartProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  onCloseDrawer: () => void;
}

const CartDrawerContent: React.FC<Props> = ({
  cartProducts,
  setCartProducts,
  isLoading,
  onCloseDrawer,
}) => {
  const { user } = useGetUser({});
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);

  const dispatch = useDispatch();
  const [isOrdered, setIsOrdered] = React.useState(false);
  const [orderId, setOrderId] = React.useState(null);

  const totalAmount = cartProducts.reduce((acc, product) => {
    // Удаляем пробелы и преобразуем в число
    const numericPrice = Number(product.price.replace(/\s/g, ''));
    return acc + numericPrice;
  }, 0);

  const taxCount = Math.round(totalAmount * 0.05);

  const handleRemoveFromCart = (productId: string, title: string) => {
    Alert.alert('Удаление товара', 'Вы действительно хотите удалить этот товар из корзины?', [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const deleteResponse = await axios.delete(
              `https://dcc2e55f63f7f47b.mokky.dev/cart/${productId}`,
            );

            if (deleteResponse.status === 200) {
              // Обновляем состояние корзины
              setCartProducts((prevProducts) =>
                prevProducts.filter((product) => product.id !== Number(productId)),
              );

              dispatch(setRemoveAllMarks(!removeAllMarks));

              // Показываем Toast
              Toast.show({
                type: 'success',
                text1: `Товар ${title} удален`,
                text2: 'Товар успешно удален из корзины',
                visibilityTime: 2000,
                autoHide: true,
                topOffset: 50,
              });
            }
          } catch (error) {
            console.error('Ошибка при удалении:', error);

            // Показываем ошибку пользователю
            Toast.show({
              type: 'error',
              text1: 'Ошибка удаления',
              text2: 'Не удалось удалить товар из корзины',
              visibilityTime: 2000,
            });

            // Детализация ошибок
            if (axios.isAxiosError(error)) {
              if (error.response?.config.url?.includes('cart-products')) {
                console.error('Ошибка при удалении из корзины');
              } else if (error.response?.config.url?.includes('products')) {
                console.error('Ошибка при обновлении статуса товара');
              }
            }
          }
        },
      },
    ]);
  };

  const [isButtonLoading, setIsButtonLoading] = React.useState(false);

  const handleOrder = async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Вы не авторизованы',
        visibilityTime: 3000,
      });
      return;
    }

    if (user && user.balance < totalAmount) {
      Toast.show({
        type: 'error',
        text1: 'Недостаточно средств',
        text2: 'У вас недостаточно средств для оформления заказа',
        visibilityTime: 3000,
      });
      return;
    }

    setIsButtonLoading(true);

    // списываем деньги с баланса
    await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user.id}`, {
      balance: user.balance - totalAmount - taxCount,
    });

    const { data } = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/orders', {
      items: cartProducts,
    });

    const priceToGive = totalAmount + taxCount;

    await sendToFinance(priceToGive);

    setOrderId(data.id);

    setTimeout(async () => {
      setIsOrdered(true);

      try {
        await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/cart', []);

        setCartProducts([]);

        dispatch(setRemoveAllMarks(!removeAllMarks));

        Toast.show({
          type: 'success',
          text1: 'Заказ успешно оформлен',
          text2: 'Ваш заказ успешно оформлен. Спасибо за покупку!',
          visibilityTime: 3000,
        });

        // Логика для tasks
        // === Логика для tasks: buy_3_product / buy_6_product ===
        try {
          // считаем только платные товары
          const paidProductsCount = cartProducts.filter((item) => Number(item.price) > 0).length;

          if (paidProductsCount > 0) {
            const [dailyRes, weeklyRes] = await Promise.all([
              axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/1'), // daily
              axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2'), // weekly
            ]);

            const daily = dailyRes.data;
            const weekly = weeklyRes.data;

            const currentDailyBuy = Number(daily?.buy_3_product ?? 0);
            const currentWeeklyBuy = Number(weekly?.buy_6_product ?? 0);

            const requests: Promise<any>[] = [];

            // DAILY: максимум 3 товара
            if (currentDailyBuy < 3) {
              const newDailyBuy = Math.min(3, currentDailyBuy + paidProductsCount);

              requests.push(
                axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
                  buy_3_product: newDailyBuy,
                }),
              );
            }

            // WEEKLY: максимум 6 товаров
            if (currentWeeklyBuy < 6) {
              const newWeeklyBuy = Math.min(6, currentWeeklyBuy + paidProductsCount);

              requests.push(
                axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
                  buy_6_product: newWeeklyBuy,
                }),
              );
            }

            if (requests.length > 0) {
              await Promise.all(requests);
            }
          }
        } catch (err) {
          console.error('Ошибка обновления прогресса покупок:', err);
        }
        // === Логика для tasks: buy_3_product / buy_6_product ===
        // end Логика для tasks
      } catch (e) {
        console.error(e);
      } finally {
        setIsButtonLoading(false);
      }
    }, 1000);
  };

  const SkeletonItem = () => {
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, []);

    return (
      <Animated.View
        style={{ opacity: opacityAnim }}
        className="flex flex-row items-center mb-4 bg-gray-100 p-4 rounded-xl">
        <View className="w-20 h-20 bg-gray-300 rounded-xl" />
        <View className="ml-4 flex-1">
          <View className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <View className="h-4 bg-gray-300 rounded w-1/4" />
        </View>
        <View className="w-8 h-8 bg-gray-300 rounded-full" />
      </Animated.View>
    );
  };

  return (
    <DrawerContent className="border-t border-t-2 rounded-t-[20px]">
      <SafeAreaView className="flex-1">
        <DrawerHeader>
          <Text className="text-[24px] font-[700] mb-[30px]">Корзина</Text>
        </DrawerHeader>

        {/* Ограниченный по высоте список товаров */}
        <View style={{ maxHeight: 300 }}>
          {isLoading ? (
            <ScrollView>
              <DrawerBody>
                {[...Array(3)].map((_, i) => (
                  <SkeletonItem key={i} />
                ))}
              </DrawerBody>
            </ScrollView>
          ) : isOrdered ? (
            <View className="flex justify-center items-center">
              <Image
                width={120}
                height={120}
                resizeMode="contain"
                source={{
                  uri: 'https://store-sneakers-vue.vercel.app/order-success-icon.png ',
                }}
              />
              <Text className="text-[22px] font-[600] text-[#87C20A] mt-[20px] mb-[9px]">
                Заказ оформлен!
              </Text>
              <Text className="font-[400] text-[16px] text-[#9b9b9b] text-center">
                Ваш заказ #{orderId} скоро будет передан
              </Text>
              <Text className="font-[400] text-[16px] text-[#9b9b9b] mb-[25px] text-center">
                курьерской доставке
              </Text>
              <Pressable
                onPress={onCloseDrawer}
                className="w-[90%] h-[55px] rounded-[18px] bg-[#9DD458] flex items-center justify-center flex-row gap-5">
                <AntDesign name="arrowleft" size={24} color="white" />
                <Text className="text-white mr-[15px] text-[17px]">Вернуться назад</Text>
              </Pressable>
            </View>
          ) : cartProducts.length > 0 ? (
            <ScrollView>
              <DrawerBody>
                {cartProducts.map((product) => (
                  <CartCard
                    key={product.id}
                    title={product.title}
                    price={product.price}
                    imgUrl={product.imageUri}
                    handleRemove={() => handleRemoveFromCart(product.id.toString(), product.title)}
                  />
                ))}
              </DrawerBody>
            </ScrollView>
          ) : (
            <View className="flex justify-center items-center">
              <Image
                width={120}
                height={120}
                resizeMode="contain"
                source={{
                  uri: 'https://store-sneakers-vue.vercel.app/package-icon.png',
                }}
              />
              <Text className="text-[22px] font-[600] mt-[20px] mb-[9px]">Корзина пустая</Text>
              <Text className="font-[400] text-[16px] text-[#9b9b9b] text-center">
                Добавьте хотя бы одну пару
              </Text>
              <Text className="font-[400] text-[16px] text-[#9b9b9b] mb-[25px] text-center">
                кроссовок, чтобы сделать заказ.
              </Text>
              <Pressable
                onPress={onCloseDrawer}
                className="w-[90%] h-[55px] rounded-[18px] bg-[#9DD458] flex items-center justify-center flex-row gap-5">
                <AntDesign name="arrowleft" size={24} color="white" />
                <Text className="text-white mr-[15px] text-[17px]">Вернуться назад</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Футер с итоговой информацией и кнопкой */}
        <DrawerFooter>
          {!isOrdered && cartProducts.length > 0 && (
            <View className="flex flex-col">
              <View className="flex flex-row justify-between w-full mb-[20px]">
                <Text>Итого: </Text>
                <View className="w-full border-b border-b-[#DFDFDF] flex-1 border-dashed mx-[9px]"></View>
                <Text className="font-bold">{totalAmount.toLocaleString('ru-RU')} руб.</Text>
              </View>

              <View className="flex flex-row justify-between w-full">
                <Text>Налог 5%: </Text>
                <View className="w-full border-b border-b-[#DFDFDF] flex-1 border-dashed mx-[9px]"></View>
                <Text className="font-bold">{taxCount.toLocaleString('ru-RU')} руб.</Text>
              </View>

              <Pressable
                onPress={handleOrder}
                disabled={isButtonLoading}
                className={`w-full h-[55px] rounded-[18px] flex items-center justify-center flex-row mt-[24px] transition-all duration-300 ${
                  isButtonLoading ? 'opacity-50 bg-[#aeafac]' : 'bg-[#9DD458]'
                }`}>
                {isButtonLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-white mr-[15px] text-[16px]">Оформить заказ</Text>
                    <Entypo name="chevron-small-right" size={24} color="white" />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </DrawerFooter>
      </SafeAreaView>
    </DrawerContent>
  );
};

export default CartDrawerContent;
