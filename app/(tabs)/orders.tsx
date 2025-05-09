import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Header from '@/components/Header';
import ProductCardComponent from '@/components/ProductCard';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import CardSkeleton from '@/components/skeletons/Card-Skeleton';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator } from 'react-native';
import { Alert } from 'react-native';

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
          backgroundColor: 'white',
          borderRadius: 4,
        },
        style,
        { opacity },
      ]}
    />
  );
};

export default function Orders() {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isLoadingIndificator, setIsLoadingIndicator] = React.useState<boolean>(false);
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);

  const ordersProducts = data.flatMap((order) => order.items);

  const fetchOrders = async () => {
    try {
      const res = await axios.get<{ id: number; items: Product[] }[]>(
        'https://dcc2e55f63f7f47b.mokky.dev/orders',
      );

      setData(res.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [removeAllMarks]);

  const handleClearOrders = () => {
    Alert.alert('Очистка истории заказов', 'Вы действительно хотите очистить список заказов?', [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Очистить',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoadingIndicator(true);
            await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/orders', []);
            setData([]);
          } catch (err) {
            console.error('Не удалось очистить историю заказов', err);
          } finally {
            setIsLoadingIndicator(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl colors={['#338fd4']} refreshing={isLoading} onRefresh={fetchOrders} />
        }>
        <View>
          <Header />
          <View style={{ paddingTop: 25, paddingHorizontal: 15, flex: 1 }}>
            <View className="flex flex-row justify-between items-center">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
                Мои покупки
              </Text>

              {ordersProducts.length > 0 ? (
                <TouchableOpacity
                  onPress={isLoading ? () => {} : handleClearOrders}
                  className="self-start flex-row items-center gap-x-2 px-[10px] py-[10px] rounded-[18px] bg-[#fd6a6a] active:bg-[#f73232] text-center flex justify-center">
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <FontAwesome name="trash" size={16} color="white" />
                      <Text className="text-[14px] text-white font-semibold text-center">
                        историю покупок
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                ''
              )}
            </View>

            {isLoadingIndificator && (
              <View className="flex flex-row justify-center items-center">
                <ActivityIndicator size="large" color="#fd6a6a" />
              </View>
            )}

            {isLoading ? (
              // Пока данные загружаются, отображаем скелетоны
              <View>
                {[0, 1, 2].map((_, index) => (
                  <View key={`skeleton-block-${index}`}>
                    <SkeletonPlaceholder
                      style={{ height: 28, width: 150, marginBottom: 20, marginLeft: 5 }}
                    />
                    <FlatList
                      data={Array.from({ length: 2 })}
                      numColumns={2}
                      keyExtractor={(_, i) => `skeleton-${index}-${i}`}
                      columnWrapperStyle={{ justifyContent: 'space-between' }}
                      contentContainerStyle={{ paddingVertical: 8 }}
                      renderItem={() => <CardSkeleton loading={true} />}
                    />
                  </View>
                ))}
              </View>
            ) : ordersProducts.length > 0 ? (
              // Если данные загрузились и есть товары, показываем их
              <View>
                {data.map((order) => (
                  <View key={order.id}>
                    <Text className="text-[20px] font-bold text-black mb-5 ml-[5px]">
                      Заказ #{order.id}
                    </Text>

                    <FlatList
                      data={order.items}
                      keyExtractor={(item) => item.id.toString()}
                      numColumns={2}
                      columnWrapperStyle={{ justifyContent: 'space-between' }}
                      renderItem={({ item }) => (
                        <ProductCardComponent {...item} removeAllButtons noRedirect />
                      )}
                    />
                  </View>
                ))}
              </View>
            ) : (
              // Если данных нет, отображаем сообщение об отсутствии товаров
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                <Image
                  style={{ width: 70, height: 70 }}
                  source={require('../../assets/images/crying-smile.png')}
                />
                <Text style={{ fontSize: 22, fontWeight: '600', marginTop: 20, marginBottom: 9 }}>
                  У вас нет заказов
                </Text>
                <Text style={{ fontSize: 16, color: '#9b9b9b', textAlign: 'center' }}>
                  Оформите хотя бы один заказ.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
