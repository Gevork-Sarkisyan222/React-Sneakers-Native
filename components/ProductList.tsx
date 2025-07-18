import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInputChangeEventData,
  NativeSyntheticEvent,
  Pressable,
  ActivityIndicator,
} from "react-native";
import ProductCardComponent from "./ProductCard";
import { Product } from "@/constants/Types";
import SearchInput from "./SearchInput";
import CardSkeleton from "./skeletons/Card-Skeleton";
import SortDropdown from "./SortDropdown";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetUser } from "@/hooks/useGetUser";
import SaleBanner from "./SaleBanner";
import { useSalePeriodSubtitle } from "@/hooks/useSalePeriodSubtitle";
import { useSalesInfo } from "./context/SalesInfoContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

interface Props {
  products: Product[];
  isLoading: boolean;
}

const ProductList: React.FC<Props> = ({ products, isLoading }) => {
  const { user, isLoading: isLoadingUser } = useGetUser({});
  const { productSaleInfo } = useSalesInfo();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);

  const onChangeValue = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setSearchValue(e.nativeEvent.text);
  };

  const RowSeparator = () => <View className="h-4" />;

  const filteredProducts = products.filter((item: Product) =>
    item.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const [selectedSort, setSelectedSort] = useState("all");

  const onSelectSort = (key: string) => {
    setSelectedSort(key);
  };

  const sortedProducts = () => {
    const parsePrice = (price: string) => Number(price.replace(/\s/g, ""));

    switch (selectedSort) {
      case "men":
        return filteredProducts.filter((item) =>
          item.title.toLowerCase().includes("муж")
        );

      case "woman":
        return filteredProducts.filter((item) =>
          item.title.toLowerCase().includes("жен")
        );

      case "price_asc":
        return [...filteredProducts].sort(
          (a, b) => parsePrice(a.price) - parsePrice(b.price)
        );

      case "price_desc":
        return [...filteredProducts].sort(
          (a, b) => parsePrice(b.price) - parsePrice(a.price)
        );

      case "all":
      default:
        return filteredProducts;
    }
  };

  const blackFridayDateSubtitle = useSalePeriodSubtitle();

  return (
    <View style={{ flex: 1, paddingTop: 25, paddingHorizontal: 15 }}>
      {isLoadingUser ? (
        <ActivityIndicator size="large" color="#338fd4" />
      ) : (
        (user?.position === "admin" ||
          user?.position === "superadmin" ||
          user?.position === "owner") && (
          <Text
            style={{
              fontSize: 23,
              fontWeight: "bold",
              color: "black",
              marginBottom: 20,
            }}
          >
            Добро пожаловать,{" "}
            {user.position === "superadmin"
              ? "Супер администратор"
              : user.position === "owner"
                ? "Владелец"
                : "Администратор"}{" "}
            {user.name}!
          </Text>
        )
      )}

      <View className="flex-row justify-center">
        {productSaleInfo.sale && (
          <SaleBanner
            title={`Акция: −${productSaleInfo.sale_discount}%`}
            subtitle="Только сегодня!"
            iconName="tag"
            backgroundColor="#ffd35b"
            imageSource={{
              uri: "https://as2.ftcdn.net/jpg/01/79/62/47/1000_F_179624715_ryd9YM392AMezgXMrR1yrfpKUG5wdD9L.jpg",
            }}
          />
        )}
        {productSaleInfo.summer_sale && (
          <SaleBanner
            title="Летняя распродажа"
            subtitle="Всё по летним ценам!"
            iconName="umbrella-beach"
            backgroundColor="#00c6ff"
            imageSource={{
              uri: "https://img.freepik.com/free-vector/end-summer-sale-promotion-illustration_23-2148625157.jpg?semt=ais_hybrid&w=740",
            }}
          />
        )}
        {productSaleInfo.black_friday && (
          <SaleBanner
            title="Чёрная пятница — до −70%"
            subtitle={blackFridayDateSubtitle}
            iconName="shopping-basket"
            backgroundColor="#1a1a1a"
            imageSource={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKWts9Bp4FJBNkQRKzPUQEty6yGRyfxQ7X2g&s",
            }}
          />
        )}
      </View>

      {user && (
        <Pressable
          onPress={() => router.push("/cases-open")}
          className="w-full h-[50px] rounded-[12px] overflow-hidden mb-4"
          style={{ elevation: 4 }}
        >
          <LinearGradient
            colors={["#fcd34d", "#fb923c", "#f43f5e", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
            }}
          >
            <Text className="text-white font-bold text-[16px] tracking-wider">
              🎁 ОТКРЫТЬ КЕЙСЫ
            </Text>
          </LinearGradient>
        </Pressable>
      )}

      {!productSaleInfo.sale &&
        !productSaleInfo.summer_sale &&
        !productSaleInfo.black_friday && (
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "black",
              marginBottom: 20,
            }}
          >
            Все <Text style={{ color: "#338fd4" }}>новые</Text> кроссовки
          </Text>
        )}

      <SearchInput
        value={searchValue}
        setValue={setSearchValue}
        onChangeValue={onChangeValue}
      />

      <SortDropdown selectedKey={selectedSort} onSelectSort={onSelectSort} />

      {/* <Pressable className="border-[#999999 w-full h-[45px] rounded-[10px] bg-white flex-row items-center px-[15px] mb-[15px]">
        Создать товар
      </Pressable> */}

      {isLoading ? (
        <FlatList
          data={Array.from({ length: 6 })}
          numColumns={2}
          keyExtractor={(_, index) => `skeleton-${index}`}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ItemSeparatorComponent={RowSeparator}
          contentContainerStyle={{ paddingVertical: 8 }} // py-2
          renderItem={() => <CardSkeleton loading={true} />}
        />
      ) : (
        <FlatList
          data={sortedProducts()}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
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
      )}

      {/* if empty result */}
      {filteredProducts.length === 0 && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "black",
              marginBottom: 20,
            }}
          >
            По вашему запросу ничего не найдено
          </Text>
          <Image
            className="mt-[10px]"
            width={100}
            height={100}
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/6134/6134065.png",
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ProductList;
