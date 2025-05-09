import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInputChangeEventData,
  NativeSyntheticEvent,
} from 'react-native';
import ProductCardComponent from './ProductCard';
import { Product } from '@/constants/Types';
import SearchInput from './SearchInput';
import CardSkeleton from './skeletons/Card-Skeleton';
import SortDropdown from './SortDropdown';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  products: Product[];
  isLoading: boolean;
}

const ProductList: React.FC<Props> = ({ products, isLoading }) => {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 500);

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
      case 'men':
        return filteredProducts.filter((item) => item.title.toLowerCase().includes('муж'));

      case 'woman':
        return filteredProducts.filter((item) => item.title.toLowerCase().includes('жен'));

      case 'price_asc':
        return [...filteredProducts].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));

      case 'price_desc':
        return [...filteredProducts].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));

      case 'all':
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
        <FlatList
          data={Array.from({ length: 6 })}
          numColumns={2}
          keyExtractor={(_, index) => `skeleton-${index}`}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ItemSeparatorComponent={RowSeparator}
          contentContainerStyle={{ paddingVertical: 8 }} // py-2
          renderItem={() => <CardSkeleton loading={true} />}
        />
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
