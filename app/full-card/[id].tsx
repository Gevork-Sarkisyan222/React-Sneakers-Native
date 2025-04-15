import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Product } from '@/constants/Types';
import Header from '@/components/Header';

export default function FullCard() {
  const { id } = useLocalSearchParams(); // Получаем id из маршрута
  const router = useRouter();
  const [currentProduct, setCurrentProduct] = useState<Product>({} as Product);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        const response = await axios.get(`https://dcc2e55f63f7f47b.mokky.dev/products/${id}`, {
          signal: controller.signal,
        });
        setCurrentProduct(response.data);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Запрос отменён:', error.message);
        } else {
          console.error('Ошибка загрузки продукта:', error);
        }
      }
    };

    fetchProduct();

    return () => {
      controller.abort();
    };
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />

      <ScrollView>
        {/* Верхняя панель с кнопкой "назад" и заголовком */}
        <View className="flex-row items-center p-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <MaterialIcons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2 text-gray-800">Детали продукта</Text>
        </View>

        {/* Основной контент */}
        <View className="px-5 py-3">
          <Image
            className="w-full h-[270px] mb-5 rounded-lg"
            source={{ uri: currentProduct.imageUri }}
            resizeMode="cover"
          />
          <Text className="text-2xl font-semibold mb-2 text-gray-900">
            {currentProduct.title || 'Название продукта'}
          </Text>
          <Text className="text-lg text-gray-700 mb-4">
            Цена: {currentProduct.price ? currentProduct.price : 'N/A'}
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            {currentProduct?.description ||
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent consectetur, metus non tempus iaculis, purus nisi ullamcorper nunc, non efficitur ligula libero eget nunc. Donec bibendum semper quam, id fermentum nisl.'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Добавь нужную логику для покупки
              console.log('Запуск покупки');
            }}
            className="bg-blue-500 py-3 rounded-lg items-center">
            <Text className="text-white font-bold text-base">Купить кроссовки</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
