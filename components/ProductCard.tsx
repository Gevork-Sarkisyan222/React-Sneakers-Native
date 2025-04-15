import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import { CartProduct, Product } from '@/constants/Types';
import axios from 'axios';
import { RootState } from '@/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { setRemoveAllMarks, setUpdateAllFavorites } from '@/redux/slices/products.slice';
import FastImage from 'react-native-fast-image';
import { useRouter } from 'expo-router';

export interface ProductCardProps {
  id: number;
  title: string;
  imageUri: string;
  price: string;
  isAddedToCart: boolean;
  isFavorite: boolean;
  handleRemoveFavorite?: (id: number) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  id,
  title,
  imageUri,
  price,
  isAddedToCart,
  isFavorite,
  handleRemoveFavorite,
}) => {
  const dispatch = useDispatch();
  const updateAllFavorites = useSelector((state: RootState) => state.products.updateAllFavorites);
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);
  const router = useRouter();

  // Состояния для загрузки и переключения статусов
  const [addedToCart, setAddedToCart] = React.useState(isAddedToCart);
  const [favorite, setFavorite] = React.useState(isFavorite);
  const [isProcessingFavorite, setIsProcessingFavorite] = React.useState(false);
  const [isProcessingCart, setIsProcessingCart] = React.useState(false);

  // Проверка статуса корзины при изменении removeAllMarks
  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const cartResponse = await axios.get(`https://dcc2e55f63f7f47b.mokky.dev/cart-products`);
        const isProductInCart = cartResponse.data.some((product: CartProduct) => product.id === id);
        setAddedToCart(isProductInCart);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: isProductInCart,
        });
      } catch (error) {
        console.error('Ошибка при проверке корзины:', error);
      }
    };
    checkCartStatus();
  }, [id, removeAllMarks]);

  // Проверка статуса избранного при изменении updateAllFavorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favoriteResponse = await axios.get(
          `https://dcc2e55f63f7f47b.mokky.dev/favorite-products`,
        );
        const isProductInFavorite = favoriteResponse.data.some(
          (product: Product) => product.id === id,
        );
        setFavorite(isProductInFavorite);
      } catch (error) {
        console.error('Ошибка при проверке избранного:', error);
      }
    };
    checkFavoriteStatus();
  }, [id, updateAllFavorites]);

  useEffect(() => {
    setAddedToCart(isAddedToCart);
  }, [isAddedToCart]);

  // Функция для переключения избранного
  const handleToggleFavorite = async () => {
    if (isProcessingFavorite) return;
    setIsProcessingFavorite(true);
    try {
      if (favorite) {
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/favorite-products/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isFavorite: false,
        });
        dispatch(setUpdateAllFavorites(!updateAllFavorites));
        handleRemoveFavorite?.(id);
      } else {
        const addedToFavoriteProduct = await axios.post<Product>(
          'https://dcc2e55f63f7f47b.mokky.dev/favorite-products',
          {
            id,
            title,
            imageUri,
            price,
            isFavorite: true,
            isAddedToCart: addedToCart,
          },
        );
        // Обновляем id товара в избранном
        await axios.patch(
          `https://dcc2e55f63f7f47b.mokky.dev/favorite-products/${addedToFavoriteProduct.data.id}`,
          { id },
        );
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isFavorite: true,
        });
        dispatch(setUpdateAllFavorites(!updateAllFavorites));
      }
    } catch (error) {
      console.error('Ошибка при переключении избранного:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.config.url?.includes('favorite-products')) {
          console.error('Ошибка при работе с избранным');
        } else if (error.response?.config.url?.includes('products')) {
          console.error('Ошибка при обновлении статуса товара');
        }
      }
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  // Функция для переключения товара в корзину
  const handleAddToCart = async () => {
    if (isProcessingCart) return;
    setIsProcessingCart(true);
    try {
      if (addedToCart) {
        await axios.delete(`https://dcc2e55f63f7f47b.mokky.dev/cart-products/${id}`);
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: false,
        });
        dispatch(setRemoveAllMarks(!removeAllMarks));
      } else {
        const createdProduct = await axios.post<CartProduct>(
          'https://dcc2e55f63f7f47b.mokky.dev/cart-products',
          {
            id,
            title,
            imageUri,
            price,
          },
        );
        await axios.patch(
          `https://dcc2e55f63f7f47b.mokky.dev/cart-products/${createdProduct.data.id}`,
          { id },
        );
        await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          isAddedToCart: true,
        });
        dispatch(setRemoveAllMarks(!removeAllMarks));
      }
    } catch (error) {
      console.error('Ошибка при переключении товара в корзине:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.config.url?.includes('cart-products')) {
          console.error('Ошибка при работе с корзиной');
        } else if (error.response?.config.url?.includes('products')) {
          console.error('Ошибка при обновлении статуса товара');
        }
      }
    } finally {
      setIsProcessingCart(false);
    }
  };

  return (
    <TouchableOpacity className="w-[48%] mb-4 h-[260px] rounded-[40px] border border-[#f3f3f3] bg-white p-[20px] px-[22px]">
      {/* Кнопка избранного */}
      <TouchableOpacity
        onPress={handleToggleFavorite}
        disabled={isProcessingFavorite}
        className={`w-[32px] h-[32px] z-[2] rounded-[7px] border border-[#f8f8f8] absolute top-[20px] left-[20px] items-center justify-center ${
          favorite ? 'bg-[#FEF0F0]' : 'bg-white'
        }`}>
        {isProcessingFavorite ? (
          <ActivityIndicator size="small" color="#FF8585" />
        ) : (
          <AntDesign name="heart" size={14} color={favorite ? '#FF8585' : '#EAEAEA'} />
        )}
      </TouchableOpacity>

      {/* Изображение товара */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/full-card/[id]',
            params: { id: id.toString() },
          })
        }>
        <Image
          style={{ width: 133, height: 112, marginBottom: 10 }}
          source={{
            uri: imageUri,
          }}
          accessibilityLabel="product image"
          resizeMode={FastImage.resizeMode.cover}
        />
      </TouchableOpacity>

      {/* Заголовок */}
      <Text className="text-[14px] font-normal text-black mb-[14px]">{title}</Text>

      {/* Нижняя часть карточки */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-medium text-[#bdbdbd]">Цена:</Text>
          <Text className="text-[14px] font-bold text-black">{price} руб.</Text>
        </View>

        {/* Кнопка добавления в корзину */}
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={isProcessingCart}
          className="w-[32px] h-[32px] rounded-[8px] border border-[#f2f2f2] items-center justify-center">
          {isProcessingCart ? (
            <ActivityIndicator size="small" color="#3CC755" />
          ) : addedToCart ? (
            <LinearGradient
              colors={['#89F09C', '#3CC755']}
              start={[0, 0]}
              end={[0, 1]}
              style={{ borderRadius: 8 }}
              className="w-full h-full rounded-[8px] items-center justify-center">
              <Feather name="check" size={24} color="#ffffff" />
            </LinearGradient>
          ) : (
            <Feather name="plus" size={24} color="#D3D3D3" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCardComponent;
