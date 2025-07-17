import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  ListRenderItemInfo,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { router } from "expo-router";
import { setUpdateProductsEffect } from "@/redux/slices/products.slice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetUser } from "@/hooks/useGetUser";
import Controller from "@/components/Controller";
import { useGetPriceWithSale } from "@/hooks/useGetPriceWithSale";
import { useSalesInfo } from "@/components/context/SalesInfoContext";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import UsersList from "@/components/UsersList";
import { AppSettingsType } from "@/constants/Types";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface Product {
  id: number;
  title: string;
  imageUri: string;
  price: string;
  description: string;
}

export default function AdminPanel(): JSX.Element {
  const { user } = useGetUser({ pathname: "admin-panel" });
  const { productSaleInfo, refresh } = useSalesInfo();
  const dispatch = useDispatch();
  const updateProducts = useSelector(
    (state: RootState) => state.products.updateProductsEffect
  );

  const [loadingStoreStatus, setLoadingStoreStatus] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "controller" | "users-list" | "add-edit" | null
  >(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>({
    title: "",
    imageUri: "",
    price: "",
    description: "",
  });

  const isOnSales =
    productSaleInfo?.sale ||
    productSaleInfo?.summer_sale ||
    productSaleInfo?.black_friday;

  const getPriceFn = (price: string) => {
    const currentPriceWithSale = useGetPriceWithSale({
      productSaleInfo,
      currentPrice: price,
    });

    return currentPriceWithSale;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Product[]>(
        "https://dcc2e55f63f7f47b.mokky.dev/products"
      );
      setProducts(response.data);
      setFiltered(response.data);
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setFiltered(
      products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, products]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ title: "", imageUri: "", price: "", description: "" });
    setModalOpen(true);
    setModalType("add-edit");
  };

  const openEdit = (item: Product) => {
    console.log(item);
    setEditItem(item);
    setForm({
      title: item.title,
      imageUri: item.imageUri,
      price: item.price,
      description: item.description,
    });
    setModalOpen(true);
    setModalType("add-edit");
  };

  const closeModal = () => setModalOpen(false);

  const handleSaveItem = async () => {
    if (!form.title || !form.price || !form.imageUri || !form.description) {
      Alert.alert(
        "Ошибка",
        "Название, цена и URL картинки и описание обязательны"
      );
      return;
    }

    if (editItem) {
      await axios.patch(
        `https://dcc2e55f63f7f47b.mokky.dev/products/${editItem.id}`,
        form
      );
      router.push(`/full-card/${editItem.id}`);
    } else {
      const newItem: Product = { ...form, id: Date.now() };

      const { data } = await axios.post(
        "https://dcc2e55f63f7f47b.mokky.dev/products",
        newItem
      );
      router.push(`/full-card/${data.id}`);
    }

    dispatch(setUpdateProductsEffect(!updateProducts));
    fetchProducts();
    closeModal();
  };

  const deleteItem = (id: number) => {
    Alert.alert(
      "Удаление товара",
      "Вы уверены что хотите удалить этот товар?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            await axios.delete(
              `https://dcc2e55f63f7f47b.mokky.dev/products/${id}`
            );
          },
        },
      ]
    );
  };

  const handleOpenModalController = () => {
    setModalType("controller");
    setModalOpen(true);
  };

  const handleOpenModalUsersList = () => {
    setModalType("users-list");
    setModalOpen(true);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (
    user &&
    user.position !== "admin" &&
    user.position !== "superadmin" &&
    user.position !== "owner"
  ) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Доступ запрещен
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<Product>): JSX.Element => (
    <TouchableOpacity
      onPress={() => router.push(`/full-card/${item.id}`)}
      className="bg-white rounded-2xl p-5 mb-5 shadow-lg"
    >
      <View className="flex-row mb-4 items-center">
        <Image
          source={{ uri: item.imageUri }}
          className="w-20 h-20 rounded-lg mr-4"
          resizeMode="contain"
        />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-gray-800">
            {item.title}
          </Text>
          <Text className="text-gray-600 mt-1">
            {isOnSales ? getPriceFn(item.price) : item.price} ₽
          </Text>
        </View>
      </View>
      <View className="flex-row justify-end gap-2">
        <TouchableOpacity
          onPress={() =>
            openEdit({
              ...item,
              price: isOnSales ? getPriceFn(item.price) : item.price,
            })
          }
        >
          <Feather name="edit" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <Feather name="trash-2" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const toggleStoreStatus = () => {
    const isCurrentlyOpen = productSaleInfo.isStoreOpen;

    Alert.alert(
      isCurrentlyOpen ? "Закрыть магазин?" : "Открыть магазин?",
      isCurrentlyOpen
        ? "Вы действительно хотите закрыть магазин? Пользователи увидят экран с сообщением: «Мы на обновлении»."
        : "Открыть магазин и снова разрешить покупки?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: isCurrentlyOpen ? "Закрыть магазин" : "Открыть магазин",
          style: isCurrentlyOpen ? "destructive" : "default",
          onPress: async () => {
            try {
              setLoadingStoreStatus(true); // 👉 начало загрузки

              await axios.patch(
                "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1",
                {
                  isStoreOpen: !isCurrentlyOpen,
                }
              );

              await refresh(); // 👉 ждем пока обновится состояние в контексте
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось обновить статус магазина");
            } finally {
              setLoadingStoreStatus(false); // 👉 завершение загрузки
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <View className="flex-row items-center gap-[10px] mb-4">
        {/* back icon */}
        <Pressable
          onPress={() => router.push("/profile")}
          className="bg-white p-2 rounded-full shadow-md shadow-gray-300 active:opacity-60"
        >
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>

        <Text className="text-2xl font-bold text-gray-800">
          Админ-панель {user?.position === "owner" && "+ владелец"}
        </Text>
      </View>

      <View className="flex-row mb-4 items-center">
        <TextInput
          placeholder="Поиск по названию..."
          value={search}
          onChangeText={setSearch}
          className="flex-1 bg-white p-3 rounded-lg shadow mr-2"
        />
        <TouchableOpacity
          onPress={openAdd}
          className="bg-[#9DD458] px-5 py-3 rounded-lg shadow"
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Pressable
        onPress={handleOpenModalController}
        className="flex-row items-center justify-center mb-[20px] bg-[#9DD458] px-4 py-3 rounded-2xl shadow shadow-blue-300 active:opacity-75"
      >
        <Feather
          name="settings"
          size={18}
          color="#fff"
          style={{ marginRight: 10 }}
        />
        <Text className="text-white font-semibold text-base">
          Пульт приложения
        </Text>
      </Pressable>

      {(user?.position === "superadmin" || user?.position === "owner") && (
        <Pressable
          onPress={handleOpenModalUsersList}
          className="flex-row items-center justify-center mb-[20px] bg-[#9DD458] px-4 py-3 rounded-2xl shadow shadow-blue-300 active:opacity-75 mt-[-10px]"
        >
          <FontAwesome6
            name="users-gear"
            size={18}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text className="text-white font-semibold text-base">
            Список пользователей
          </Text>
        </Pressable>
      )}

      {(user?.position === "superadmin" || user?.position === "owner") && (
        <Pressable
          onPress={toggleStoreStatus}
          className="flex-row items-center justify-center mb-[20px] bg-[#9DD458] px-4 py-3 rounded-2xl shadow shadow-blue-300 active:opacity-75 mt-[-10px]"
        >
          {loadingStoreStatus ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome6
                style={{ marginRight: 10 }}
                name="door-closed"
                size={24}
                color="white"
              />
              <Text className="text-white font-semibold text-base">
                {productSaleInfo.isStoreOpen
                  ? "Закрыть магазин"
                  : "Открыть магазин"}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {user?.position === "owner" && (
        <Pressable
          onPress={() => router.push("/store-finance")}
          className="flex-row items-center justify-center mb-[20px] bg-[#9DD458] px-4 py-3 rounded-2xl shadow shadow-blue-300 active:opacity-75 mt-[-10px]"
        >
          <FontAwesome
            style={{ marginRight: 10 }}
            name="money"
            size={24}
            color="white"
          />
          <Text className="text-white font-semibold text-base">
            Финансы магазина
          </Text>
        </Pressable>
      )}

      <FlatList
        refreshControl={
          <RefreshControl
            colors={["#338fd4"]}
            refreshing={loading}
            onRefresh={fetchProducts}
          />
        }
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={() =>
          search === "" ? (
            <View className="flex items-center m-auto">
              <Text className="text-center text-gray-500 mt-10 text-[16px]">
                Товары в приложении пустые
              </Text>
              <Image
                className="mt-[20px]"
                width={110}
                height={110}
                resizeMode="contain"
                source={{
                  uri: "https://store-sneakers-vue.vercel.app/package-icon.png",
                }}
              />
            </View>
          ) : (
            <View className="flex items-center m-auto">
              <Text className="text-center text-gray-500 mt-10">
                По запросу «{search}» ничего не найдено
              </Text>
              <Image
                className="mt-[20px]"
                width={100}
                height={100}
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/6134/6134065.png",
                }}
              />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        {/* Обёртка для фона, ловит нажатия на пустую область */}
        <Pressable
          className="flex-1 justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={closeModal}
        >
          {/* Чтобы клики по внутреннему View не закрывали модалку — оборачиваем его в ещё один Pressable без обработчика */}
          <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
            {modalType === "controller" ? (
              <Controller
                onCloseModal={closeModal}
                setModalType={setModalType}
                isVisible={modalOpen}
              />
            ) : modalType === "users-list" ? (
              <UsersList />
            ) : (
              <>
                <Text className="text-xl font-semibold text-gray-800 mb-4">
                  {editItem ? "Редактировать товар" : "Новый товар"}
                </Text>
                <ScrollView>
                  <TextInput
                    placeholder="Название"
                    value={form.title}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, title: text }))
                    }
                    className="bg-gray-100 p-3 rounded-lg mb-3"
                  />
                  <TextInput
                    placeholder="URL картинки"
                    value={form.imageUri}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, imageUri: text }))
                    }
                    className="bg-gray-100 p-3 rounded-lg mb-3"
                  />
                  <TextInput
                    placeholder="Цена"
                    value={form.price}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, price: text }))
                    }
                    className="bg-gray-100 p-3 rounded-lg mb-3"
                  />
                  <TextInput
                    placeholder="Описание"
                    value={form.description}
                    multiline
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, description: text }))
                    }
                    className="bg-gray-100 p-3 rounded-lg h-24 text-gray-700 mb-5"
                  />
                  <View className="flex-row justify-end space-x-4">
                    <TouchableOpacity
                      onPress={closeModal}
                      className="px-5 py-2"
                    >
                      <Text className="text-gray-700 uppercase">Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveItem}
                      className="px-5 py-2 bg-[#9DD458] rounded-lg shadow"
                    >
                      <Text className="text-white uppercase">Сохранить</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
