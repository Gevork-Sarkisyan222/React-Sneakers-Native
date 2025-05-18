import Header from '@/components/Header';
import ProductList from '@/components/ProductList';
import { AppSettingsType, Product } from '@/constants/Types';
import { setProducts } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

export default function Index() {
  const products = useSelector((state: RootState) => state.products.products);
  const updateProducts = useSelector((state: RootState) => state.products.updateProductsEffect);

  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // ПЕРЕМЕШИВАЕТ МАССИВ ТОВАРОВ СЛУЧАЙНЫМ ОБРАЗОМ
  const shuffleArray = (array: Product[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const res = await axios.get<Product[]>(
        'https://dcc2e55f63f7f47b.mokky.dev/products?_select=-description,-comments',
      );
      const shuffled = shuffleArray(res.data);
      dispatch(setProducts(shuffled));
    } catch (error) {
      console.error('Ошибка при загрузке:', error);
      dispatch(setProducts([]));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [dispatch, updateProducts]);

  return (
    <>
      <SafeAreaView>
        <ScrollView
          refreshControl={
            <RefreshControl colors={['#338fd4']} refreshing={isLoading} onRefresh={fetchProducts} />
          }>
          <View>
            <Header />

            <ProductList products={products} isLoading={isLoading} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999999,
          elevation: 999999,
        }}>
        <Toast />
      </View> */}
    </>
  );
}
