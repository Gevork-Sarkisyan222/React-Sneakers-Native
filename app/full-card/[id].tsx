import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CartProduct, Comment, Product } from '@/constants/Types';
import Header from '@/components/Header';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setRemoveAllMarks, setUpdateAllFavorites } from '@/redux/slices/products.slice';
import Entypo from '@expo/vector-icons/Entypo';
import { useSalesInfo } from '@/components/context/SalesInfoContext';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import CommentsSection from '@/components/CommentsSection';

export default function FullCard() {
  const { productSaleInfo } = useSalesInfo();
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

  // работа со скидкой
  const isOnSales =
    productSaleInfo?.sale || productSaleInfo?.summer_sale || productSaleInfo?.black_friday;

  // Убираем из строки всё, кроме цифр и точки
  const cleanedPriceStr = currentProduct.price?.replace(/[^0-9.]/g, '');
  const parsedPrice = Number(cleanedPriceStr) || 0;

  // Если скидка тоже приходит строкой со спецсимволами — аналогично очищаем
  const cleanedDiscountStr = String(productSaleInfo?.sale_discount)?.replace(/[^0-9.]/g, '');
  const parsedDiscount = Number(cleanedDiscountStr) || 0;

  // Вычисляем все три варианта
  const blackFridaySalesPrice = Math.round(parsedPrice * 0.3); // 70% скидки
  const summerSalesPrice = Math.round(parsedPrice * 0.6); // 40% скидки
  const globalSalePrice = Math.round(parsedPrice * (1 - parsedDiscount / 100));

  // Приоритет акций: чёрная пятница → летняя распродажа → глобальная → обычная
  const currentPriceWithSale = (
    productSaleInfo?.black_friday
      ? blackFridaySalesPrice
      : productSaleInfo?.summer_sale
      ? summerSalesPrice
      : productSaleInfo?.sale
      ? globalSalePrice
      : parsedPrice
  ).toString();

  // count stars

  const comments = currentProduct.comments || [];

  const averageRating = useMemo(() => {
    if (comments.length === 0) {
      return 0;
    }
    const total = comments.reduce((sum, c) => sum + c.stars, 0);
    return total / comments.length;
  }, [comments]);

  // Проверка статуса корзины при изменении removeAllMarks
  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const cartResponse = await axios.get(`https://dcc2e55f63f7f47b.mokky.dev/cart`);
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

  const controller = new AbortController();

  const fetchProduct = async () => {
    try {
      const response = await axios.get<Product>(
        `https://dcc2e55f63f7f47b.mokky.dev/products/${id}?_relations=users`,
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

  useEffect(() => {
    if (!id) return;

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
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/favorites/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isFavorite: false,
        });
      } else {
        const added = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/favorites', {
          id: Number(id),
          title: currentProduct.title,
          imageUri: currentProduct.imageUri,
          price: isOnSales ? currentPriceWithSale : currentProduct.price,
          isFavorite: true,
          isAddedToCart,
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/favorites/${added.data.id}`, {
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
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/cart/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: false,
        });
      } else {
        const created = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cart', {
          id: Number(id),
          title: currentProduct.title,
          imageUri: currentProduct.imageUri,
          price: isOnSales ? currentPriceWithSale : currentProduct.price,
        });
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/cart/${created.data.id}`, {
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

  const handleNewComment = (newComment: Comment) => {
    setCurrentProduct((prev) => ({
      ...prev,
      comments: [...(prev.comments || []), newComment] as Comment[],
    }));
  };

  const handleDeleteComment = (id: number) => {
    setCurrentProduct((prev) => ({
      ...prev,
      comments: (prev.comments || []).filter((c) => c.id !== id) as Comment[],
    }));
  };

  const handleEditComment = (id: number, editedText: string, editedStars: number) => {
    setCurrentProduct((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((c) =>
        c.id === id ? { ...c, text: editedText, stars: editedStars } : c,
      ),
    }));
  };

  useEffect(() => {
    if (!currentProduct.id || comments.length === 0) return; // защита от «нулевого» патча

    (async () => {
      try {
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          rating: averageRating,
        });
      } catch (e) {
        console.error('Не удалось обновить рейтинг:', e);
      }
    })();
  }, [averageRating, currentProduct.id, comments.length]);

  const [refreshing, setRefreshing] = useState(false);

  const rating = Number(currentProduct.rating);

  const formattedRating = Number.isInteger(rating)
    ? rating.toString()
    : rating.toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

  if (!currentProduct.id) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />

      <ScrollView
        refreshControl={
          <RefreshControl colors={['#338fd4']} refreshing={refreshing} onRefresh={fetchProduct} />
        }>
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

          {/* Компонент Рейтинг */}
          <View className="flex-row">
            <StarRatingDisplay
              style={{ marginBottom: 5, marginLeft: -5 }}
              starSize={30}
              maxStars={5}
              rating={currentProduct.rating}
            />

            <Text className="mr-[5px]">{formattedRating} Звезд</Text>
          </View>

          <Text className="text-sm text-gray-700 mr-1">Цена:</Text>

          <Text
            className={`leading-[16px] ${
              isOnSales
                ? 'text-[14px] text-gray-400 line-through mr-2'
                : 'text-[18px] text-black font-bold mt-[6px] mb-[10px]'
            }`}>
            {currentProduct.price} ₽.
          </Text>

          {isOnSales && (
            <Text className="text-[18px] text-green-600 font-bold">{currentPriceWithSale} ₽</Text>
          )}

          <Text className="text-base text-gray-600 mb-6">{currentProduct.description}</Text>

          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={loadingCart}
            className="bg-[#9DD458] py-4 rounded-[18px] items-center flex flex-row justify-center gap-[12px] mb-[30px]">
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

          {/* Секция Отзывов comments */}
          <CommentsSection
            productId={currentProduct.id}
            items={currentProduct.comments}
            onNewComment={handleNewComment}
            onDeleteComment={handleDeleteComment}
            onEditComment={handleEditComment}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
