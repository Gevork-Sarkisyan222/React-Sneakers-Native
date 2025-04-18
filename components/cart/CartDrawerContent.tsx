import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Image, Platform, Pressable, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';

import CartCard from './CartCard';
import { ScrollView } from 'react-native';
import axios from 'axios';
import { Product } from '@/constants/Types';
import Toast from 'react-native-toast-message';
import AntDesign from '@expo/vector-icons/AntDesign';
import { setProducts, setRemoveAllMarks } from '@/redux/slices/products.slice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface Props {
  onCloseDrawer: () => void;
}

const CartDrawerContent: React.FC<Props> = ({ onCloseDrawer }) => {
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);
  const [cartProducts, setCartProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const dispatch = useDispatch();
  const [isOrdered, setIsOrdered] = React.useState(false);

  const totalAmount = cartProducts.reduce((acc, product) => {
    // Удаляем пробелы и преобразуем в число
    const numericPrice = Number(product.price.replace(/\s/g, ''));
    return acc + numericPrice;
  }, 0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get<Product[]>('https://dcc2e55f63f7f47b.mokky.dev/cart-products');
        setCartProducts(res.data);
      } catch (error) {
        setCartProducts([]);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
            // Параллельно выполняем оба запроса
            // const [deleteResponse, patchResponse] = await Promise.all([

            const deleteResponse = await axios.delete(
              `https://dcc2e55f63f7f47b.mokky.dev/cart-products/${productId}`,
            );

            // axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`, {
            //   isAddedToCart: false,
            // }),
            // ]);

            // if (deleteResponse.status === 200 && patchResponse.status === 200) {
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

  const handleOrder = async () => {
    setIsOrdered(true);
    try {
      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/cart-products', []);

      setCartProducts([]);

      // for render useEffect in ProductCardComponent
      dispatch(setRemoveAllMarks(!removeAllMarks));

      Toast.show({
        type: 'success',
        text1: 'Заказ успешно оформлен',
        text2: 'Ваш заказ успешно оформлен. Спасибо за покупку!',
        visibilityTime: 3000,
      });
    } catch (e) {
      console.error(e);
    }
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

  // generate random number constant
  const randomNumber = Math.floor(Math.random() * 60);

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
                source={{
                  uri: 'https://s3-alpha-sig.figma.com/img/92fb/2ee9/e138ce6c501b0439339df82882bbe7d2?Expires=1742774400&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=RvuwXkp-A5zESQMSZZmJ7xJJ~ZoDe4wJqKwNcvwJsa-3LtNFwQOMdN3YjKKWlD0jC22RXX6hjjc9WBDk~4GaFM37aavA8Jd7Qnh91FRfMY5H~DAogSYO7bCu8KRi6boIUHcIKBGW5UD9zWSoiRHSp26JQfcLK~AKRzGrrD8qZOv9flGDJHfBMo5udNDRk9dV6BuKrNsNZ0HMyURSPD2i8UtMtMP-TVTiy1DrLHWAgOsT7vgSGQe1BRMKAmKFDv3Nz8C3XFFy~EjNf0VIoLrtX~b0y9zJO8R17dluQz7aBTSNiW~NPjZErCp9MoVo78TKfUPXj--wm-tXVevUzO96XA__',
                }}
              />
              <Text className="text-[22px] font-[600] text-[#87C20A] mt-[20px] mb-[9px]">
                Заказ оформлен!
              </Text>
              <Text className="font-[400] text-[16px] text-[#9b9b9b] text-center">
                Ваш заказ #{randomNumber} скоро будет передан
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
                source={{
                  uri: 'https://s3-alpha-sig.figma.com/img/174b/53d6/e0efb90ef8ce4fb82d0f992b7486e782?Expires=1742774400&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=gWz2SquIWzJnNFD21XZr9CRggj2fUgQMaPXGw1iqnG-aqN7CTdjefgvVEw-Jy5gkEXc~QNmOSpDyaa28fxFwHxjZJGbIh5qt~ZESZK6ainVKn7FjlfMYhnZrfaMd4zem-Vrw2KGUazidnWK9IEBn-tC3MLLrom9hXuhmfliGJGfb6M~~GBklQDsyJkDZL7AFjbnBjJmsJNfXp4hkxen3nd7syTKnwlTYquNsZMXutW9pm1LrILu1OKBNTTENQ3kuH6NF-IZwc61QhmGtWrR03aVVLrR8fghOINsvy1QYQ6x1dxEBWmiPyJocrHu9oND5BjBwwuIgHCERHux1HJ9G0g__',
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
                <Text className="font-bold">{Math.round(totalAmount * 0.05)} руб.</Text>
              </View>

              <Pressable
                onPress={handleOrder}
                className="w-full h-[55px] rounded-[18px] bg-[#9DD458] flex items-center justify-center flex-row mt-[24px]">
                <Text className="text-white mr-[15px] text-[16px]">Оформить заказ</Text>
                <Entypo name="chevron-small-right" size={24} color="white" />
              </Pressable>
            </View>
          )}
        </DrawerFooter>
      </SafeAreaView>
    </DrawerContent>
  );
};

export default CartDrawerContent;
