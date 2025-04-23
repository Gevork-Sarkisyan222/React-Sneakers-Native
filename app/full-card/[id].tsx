import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CartProduct, Product } from '@/constants/Types';
import Header from '@/components/Header';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setRemoveAllMarks, setUpdateAllFavorites } from '@/redux/slices/products.slice';
import Entypo from '@expo/vector-icons/Entypo';

export default function FullCard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [currentProduct, setCurrentProduct] = useState<Product>({} as Product);
  const dispatch = useDispatch();

  // Возвращенные Redux селекторы
  const updateAllFavorites = useSelector((state: RootState) => state.products.updateAllFavorites);
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);

  const [isAddedToFavorite, setIsAddedToFavorite] = useState<boolean>(false);
  const [isAddedToCart, setIsAddedToCart] = useState<boolean>(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);

  // Проверка статуса корзины при изменении removeAllMarks
  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const cartResponse = await axios.get(`https://dcc2e55f63f7f47b.mokky.dev/cart-products`);
        const isProductInCart = cartResponse.data.some(
          (product: CartProduct) => Number(product.id) === Number(id),
        );
        setIsAddedToCart(isProductInCart);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: isProductInCart,
        });
      } catch (error) {
        console.error('Ошибка при проверке корзины:', error);
      }
    };
    checkCartStatus();
  });

  // =======================

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchProduct = async () => {
      try {
        const response = await axios.get<Product>(
          `https://dcc2e55f63f7f47b.mokky.dev/products/${id}`,
          { signal: controller.signal },
        );
        const prod = response.data;
        setCurrentProduct(prod);
        setIsAddedToFavorite(prod.isFavorite);
        setIsAddedToCart(prod.isAddedToCart);
      } catch (error) {
        if (!axios.isCancel(error)) console.error('Ошибка загрузки продукта:', error);
      }
    };
    fetchProduct();
    return () => controller.abort();
  }, [id, updateAllFavorites, removeAllMarks]); // Возвращены зависимости

  const handleToggleFavorite = async () => {
    if (loadingFavorite) return;
    setLoadingFavorite(true);
    const previousFavorite = isAddedToFavorite;
    try {
      setIsAddedToFavorite(!previousFavorite);
      setCurrentProduct((prev) => ({ ...prev, isFavorite: !previousFavorite }));

      if (previousFavorite) {
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/favorite-products/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isFavorite: false,
        });
      } else {
        const added = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/favorite-products', {
          id: Number(id),
          title: currentProduct.title,
          imageUri: currentProduct.imageUri,
          price: currentProduct.price,
          isFavorite: true,
          isAddedToCart,
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/favorite-products/${added.data.id}`, {
          id: Number(id),
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isFavorite: true,
        });
      }
      dispatch(setUpdateAllFavorites(!updateAllFavorites)); // Диспатч действия
    } catch (error) {
      setIsAddedToFavorite(previousFavorite);
      setCurrentProduct((prev) => ({ ...prev, isFavorite: previousFavorite }));
      console.error('Ошибка при переключении избранного:', error);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleAddToCart = async () => {
    if (loadingCart) return;
    setLoadingCart(true);
    const previousCart = isAddedToCart;
    try {
      setIsAddedToCart(!previousCart);
      setCurrentProduct((prev) => ({ ...prev, isAddedToCart: !previousCart }));

      if (previousCart) {
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/cart-products/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: false,
        });
      } else {
        const created = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cart-products', {
          id: Number(id),
          title: currentProduct.title,
          imageUri: currentProduct.imageUri,
          price: currentProduct.price,
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/cart-products/${created.data.id}`, {
          id: Number(id),
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: true,
        });
      }
      dispatch(setRemoveAllMarks(!removeAllMarks)); // Диспатч действия
    } catch (error) {
      setIsAddedToCart(previousCart);
      setCurrentProduct((prev) => ({ ...prev, isAddedToCart: previousCart }));
      console.error('Ошибка при переключении корзины:', error);
    } finally {
      setLoadingCart(false);
    }
  };

  if (!currentProduct.id) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />

      <ScrollView>
        <View className="flex-row items-center p-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <MaterialIcons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2 text-gray-800">Детали продукта</Text>
        </View>

        <View className="px-5 py-3 relative">
          <Image
            className="w-full h-[270px] mb-5 rounded-lg"
            source={{ uri: currentProduct.imageUri }}
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={loadingFavorite}
            className="absolute right-[50px]">
            {loadingFavorite ? (
              <ActivityIndicator size="small" />
            ) : (
              <AntDesign
                name={isAddedToFavorite ? 'heart' : 'hearto'}
                size={24}
                color={isAddedToFavorite ? '#FF8585' : '#EAEAEA'}
              />
            )}
          </TouchableOpacity>

          <Text className="text-2xl font-semibold mb-2 text-gray-900">{currentProduct.title}</Text>
          <Text className="text-lg text-gray-700 mb-4">
            Цена: {currentProduct.price || 'N/A'} ₽
          </Text>
          <Text className="text-base text-gray-600 mb-6">{currentProduct.description}</Text>

          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={loadingCart}
            className="bg-[#9DD458] py-4 rounded-[18px] items-center flex flex-row justify-center gap-[12px]">
            {loadingCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-base">
                  {isAddedToCart ? 'Удалить из корзины' : 'Добавить в корзину'}
                </Text>
                {isAddedToCart ? (
                  <MaterialIcons name="delete-sweep" size={24} color="white" />
                ) : (
                  <Entypo name="plus" size={24} color="white" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
