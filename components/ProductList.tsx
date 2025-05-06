import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TextInputChangeEventData,
  NativeSyntheticEvent,
} from 'react-native';
import axios from 'axios';
import ProductCardComponent from './ProductCard';
import { Product } from '@/constants/Types';
import { useDispatch, useSelector } from 'react-redux';
import { setProducts } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';
import SearchInput from './SearchInput';
import CardSkeleton from './skeletons/Card-Skeleton';
import AntDesign from '@expo/vector-icons/AntDesign';
import SortDropdown from './SortDropdown';
import { useDebounce } from '@/hooks/useDebounce';

const ProductList: React.FC = () => {
  const products = useSelector((state: RootState) => state.products.products);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 500);

  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // ==============================

  const fetchProducts = async () => {
    try {
      setIsLoading(true); // Добавляем установку состояния загрузки
      const res = await axios.get<Product[]>('https://dcc2e55f63f7f47b.mokky.dev/products');
      dispatch(setProducts(res.data));
    } catch (error) {
      console.error('Ошибка при загрузке:', error);
      dispatch(setProducts([]));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [dispatch]);

  const onChangeValue = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setSearchValue(e.nativeEvent.text);
  };

  const RowSeparator = () => <View className="h-4" />;

  const filteredProducts = products.filter((item: Product) =>
    item.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const [selectedSort, setSelectedSort] = useState('all');

  const onSelectSort = (key: string) => {
    setSelectedSort(key);
  };

  const sortedProducts = () => {
    const parsePrice = (price: string) => Number(price.replace(/\s/g, ''));

    switch (selectedSort) {
      case 'price_asc':
        return [...filteredProducts].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case 'price_desc':
        return [...filteredProducts].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      default:
        return filteredProducts;
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 25, paddingHorizontal: 15 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
        Все <Text style={{ color: '#338fd4' }}>новые</Text> кроссовки
      </Text>

      <SearchInput value={searchValue} setValue={setSearchValue} onChangeValue={onChangeValue} />

      <SortDropdown selectedKey={selectedSort} onSelectSort={onSelectSort} />

      {isLoading ? (
        <ScrollView>
          <FlatList
            data={Array.from({ length: 6 })}
            numColumns={2}
            keyExtractor={(_, index) => `skeleton-${index}`}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ItemSeparatorComponent={RowSeparator}
            contentContainerStyle={{ paddingVertical: 8 }} // py-2
            renderItem={() => <CardSkeleton loading={true} />}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={sortedProducts()}
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
      )}

      {/* if empty result */}
      {filteredProducts.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black', marginBottom: 20 }}>
            По вашему запросу ничего не найдено
          </Text>
          <Image
            className="mt-[10px]"
            width={100}
            height={100}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }}
          />
        </View>
      )}
    </View>
  );
};

export default ProductList;
