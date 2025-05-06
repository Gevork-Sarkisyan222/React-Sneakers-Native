import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, ScrollView, Image } from 'react-native';
import Header from '@/components/Header';
import ProductCardComponent from '@/components/ProductCard';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { FlatList } from 'react-native';
import CardSkeleton from '@/components/skeletons/Card-Skeleton';

export default function Favorites() {
  const [favoriteProducts, setFavoriteProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const updateAllFavorites = useSelector((state: RootState) => state.products.updateAllFavorites);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      try {
        const res = await axios.get<Product[]>(
          'https://dcc2e55f63f7f47b.mokky.dev/favorite-products',
        );
        setFavoriteProducts(res.data);
      } catch (error) {
        setFavoriteProducts([]);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [updateAllFavorites]);

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Header />

          <View style={{ paddingTop: 25, paddingHorizontal: 15, flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
              Мои закладки
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
                  source={{
                    uri: 'https://s3-alpha-sig.figma.com/img/35c8/c43c/a9c996e7c1e51afc043e2c885fbfd4b5?Expires=1744588800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=irZvlQz8OWDlXjIrx6HOr3orZSzrzh8C-0CGVupRBDCiRa3jflZdbtg3TIlZ6BWvr5PW69KJQ~O03R~8BhTKGV2QtZxV6pqD-52U5DsYYKZyhetQiXjJJSkUdO~hZpU6WnbJbf62Srw9UiCGfRJrfmhK~IvRP2MfPSfOr-L2-gIp5wqrwXoOtqg66Rl3PRZXwYOexlX1qbK77cwrVZz3wNA8pAtJEYk2aB2hkHSF8KzVnFRDe5JUdUwllZ3v30Cm725w~w7fDYN6MP3PDP0XIC~CC7HmoSOsZlYtw~7fuPdXCVtkDpkDvxjgW4kOIte7n7r2-A-ZC4fzZZ9FGF4p4Q__',
                  }}
                />
                <Text style={{ fontSize: 22, fontWeight: '600', marginTop: 20, marginBottom: 9 }}>
                  Закладок нет :(
                </Text>
                <Text style={{ fontSize: 16, color: '#9b9b9b', textAlign: 'center' }}>
                  Вы ничего не добавляли в закладки.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
