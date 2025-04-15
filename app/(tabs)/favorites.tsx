import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import Header from '@/components/Header';
import ProductCardComponent from '@/components/ProductCard';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

// Наш кастомный SkeletonPlaceholder
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

  const handleRemoveFavorite = (id: number) => {
    setFavoriteProducts((prevFavorites) => prevFavorites.filter((product) => product.id !== id));
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Header />
          <View style={{ paddingTop: 25, paddingHorizontal: 15, flex: 1 }}>
            {isLoading ? (
              // Пока данные загружаются, отображаем скелетоны
              <View>
                {/* Скелетон для заголовка */}
                <SkeletonPlaceholder style={{ width: 200, height: 30, marginBottom: 20 }} />
                {/* Сетка скелетонов для карточек */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
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
              </View>
            ) : favoriteProducts.length > 0 ? (
              // Если данные загрузились и есть товары, показываем их
              <View>
                <Text
                  style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
                  Мои закладки
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                  {favoriteProducts.map((product) => (
                    <ProductCardComponent
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      imageUri={product.imageUri}
                      price={product.price}
                      isFavorite={product.isFavorite}
                      isAddedToCart={product.isAddedToCart}
                      handleRemoveFavorite={handleRemoveFavorite}
                    />
                  ))}
                </View>
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
