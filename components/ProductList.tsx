import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ProductCardComponent from './ProductCard';
import { Product } from '@/constants/Types';
import { useDispatch, useSelector } from 'react-redux';
import { setProducts } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';

import EventEmitter from 'eventemitter3';

// Компонент SkeletonPlaceholder для одного элемента
const SkeletonPlaceholder: React.FC<{ style?: object }> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#e1e9ee',
          borderRadius: 4,
        },
        style,
        { opacity },
      ]}
    />
  );
};

const ProductList: React.FC = () => {
  const products = useSelector((state: RootState) => state.products.products);

  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // ==============================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get<Product[]>('https://dcc2e55f63f7f47b.mokky.dev/products');
        dispatch(setProducts(res.data));
      } catch (error) {
        dispatch(setProducts([]));
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [dispatch]);

  if (isLoading) {
    // Отрисовка скелетонов во время загрузки
    return (
      <ScrollView contentContainerStyle={{ paddingTop: 25, paddingHorizontal: 15 }}>
        {/* Заголовок */}
        <SkeletonPlaceholder style={{ width: 200, height: 30, marginBottom: 20 }} />
        {/* Сетка скелетонов для карточек */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonPlaceholder
              key={index}
              style={{
                width: 150,
                height: 200,
                marginBottom: 20,
              }}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 25, paddingHorizontal: 15 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
        Все новые кроссовки
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {products.map((product: Product) => (
          <ProductCardComponent
            key={product.id}
            id={product.id}
            title={product.title}
            imageUri={product.imageUri}
            price={product.price}
            isFavorite={product.isFavorite}
            isAddedToCart={product.isAddedToCart}
          />
        ))}
      </View>
    </View>
  );
};

export default ProductList;
