import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, ScrollView, Image, RefreshControl } from 'react-native';
import Header from '@/components/Header';
import ProductCardComponent from '@/components/ProductCard';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { FlatList } from 'react-native';
import CardSkeleton from '@/components/skeletons/Card-Skeleton';
import { useSalesInfo } from '@/components/context/SalesInfoContext';

export default function Favorites() {
  const { productSaleInfo } = useSalesInfo();
  const [favoriteProducts, setFavoriteProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const updateAllFavorites = useSelector((state: RootState) => state.products.updateAllFavorites);

  const fetchFavoriteProducts = async () => {
    try {
      const res = await axios.get<Product[]>(
        'https://dcc2e55f63f7f47b.mokky.dev/favorites?_select=-description',
      );
      setFavoriteProducts(res.data);
    } catch (error) {
      setFavoriteProducts([]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [updateAllFavorites]);

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={['#338fd4']}
            refreshing={isLoading}
            onRefresh={fetchFavoriteProducts}
          />
        }>
        <View>
          <Header />

          <View style={{ paddingTop: 25, paddingHorizontal: 15, flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
              My favorites
            </Text>

            {isLoading ? (
              // Пока данные загружаются, отображаем скелетоны
              <View>
                {/* Сетка скелетонов для карточек */}
                <FlatList
                  data={Array.from({ length: 4 })}
                  numColumns={2}
                  keyExtractor={(_, index) => `skeleton-${index}`}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  contentContainerStyle={{ paddingVertical: 8 }} // py-2
                  renderItem={() => <CardSkeleton loading={true} />}
                />
              </View>
            ) : favoriteProducts.length > 0 ? (
              // Если данные загрузились и есть товары, показываем их
              <View>
                <FlatList
                  data={favoriteProducts}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  renderItem={({ item }) => (
                    <ProductCardComponent
                      productSaleInfo={productSaleInfo}
                      id={item.id}
                      title={item.title}
                      imageUri={item.imageUri}
                      price={item.price}
                      isFavorite={item.isFavorite}
                      isAddedToCart={item.isAddedToCart}
                    />
                  )}
                />
              </View>
            ) : (
              // Если данных нет, отображаем сообщение об отсутствии закладок
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                <Image
                  style={{ width: 70, height: 70 }}
                  source={require('../../assets/images/sad-smile.png')}
                />
                <Text style={{ fontSize: 22, fontWeight: '600', marginTop: 20, marginBottom: 9 }}>
                  No favorites :(
                </Text>
                <Text style={{ fontSize: 16, color: '#9b9b9b', textAlign: 'center' }}>
                  You haven't added anything to your favorites.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
