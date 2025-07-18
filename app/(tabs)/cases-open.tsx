import React, { useLayoutEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

type SneakerCase = {
  id: string;
  title: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
  itemsInside: number;
  imageUrl: string;
};

const CasesOpenPage = () => {
  const [buyedCases, setBuyedCases] = React.useState<SneakerCase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchBuyedCases = async () => {
    setIsLoading(true);

    try {
      const { data } = await axios.get(
        "https://dcc2e55f63f7f47b.mokky.dev/cases"
      );
      setBuyedCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useLayoutEffect(() => {
    fetchBuyedCases();
  }, []);

  const cases: SneakerCase[] = [
    {
      id: "1",
      title: "Обычный Кейс",
      rarity: "common",
      price: 2999,
      itemsInside: 1,
      imageUrl:
        "https://images.meesho.com/images/products/534430220/ixjox_512.webp",
    },
    {
      id: "2",
      title: "Лимитированный Кейс",
      rarity: "legendary",
      price: 11999,
      itemsInside: 5,
      imageUrl:
        "https://media.istockphoto.com/id/1471122805/photo/pair-of-yellow-sneakers-on-yellow-background-copy-space.jpg?s=612x612&w=0&k=20&c=BxoQVxQMfjSGBxAlcqHVIHjKOqiVnnwbelmvs9-Xq6k=",
    },
    {
      id: "3",
      title: "Редкий Кейс",
      rarity: "rare",
      price: 8999,
      itemsInside: 2,
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfY15nTEavNrnRDE2_--mbMuol1ZRtzcNKuA&s",
    },
    {
      id: "4",
      title: "Премиум Кейс",
      rarity: "epic",
      price: 16999,
      itemsInside: 3,
      imageUrl:
        "https://brand.assets.adidas.com/image/upload/f_auto,q_auto:best,fl_lossy/if_w_gt_800,w_800/shoes_men_tcc_d_44a809233a.jpg",
    },
  ];

  const getRarityColor = (rarity: SneakerCase["rarity"]) => {
    switch (rarity) {
      case "common":
        return "bg-gray-300";
      case "rare":
        return "bg-blue-600";
      case "epic":
        return "bg-purple-500";
      case "legendary":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRarityText = (rarity: SneakerCase["rarity"]) => {
    switch (rarity) {
      case "common":
        return "ОБЫЧНЫЙ";
      case "rare":
        return "РЕДКИЙ";
      case "epic":
        return "ЭПИЧЕСКИЙ";
      case "legendary":
        return "ЛЕГЕНДАРНЫЙ";
      default:
        return rarity;
    }
  };

  const handleBuyCase = async (item: SneakerCase) => {
    if (!item) return;

    Alert.alert(
      "Подтверждение",
      "Вы действительно хотите купить этот кейс за " + item.price + " ₽ ?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Купить",
          onPress: async () => {
            try {
              const { data } = await axios.post(
                "https://dcc2e55f63f7f47b.mokky.dev/cases",
                item
              );

              fetchBuyedCases();
              Alert.alert("Успех", "Кейс успешно куплен");
            } catch (err) {
              console.error(err);
              Alert.alert("Ошибка", "Не удалось купить кейс");
            }
          },
          style: "default",
        },
      ]
    );
  };

  const caseBuyed = (item: SneakerCase) => {
    return buyedCases.find((caseItem) => caseItem.rarity === item.rarity);
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#f0f4f8", "#e2e8f0", "#dbeafe"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#3B82F" />
        <Text className="text-black mt-4 font-semibold">
          Загрузка кейсов...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#f0f4f8", "#e2e8f0", "#dbeafe"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        className="flex-1"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <ScrollView
          className="p-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text className="text-[25px] font-bold text-black mb-1 text-center uppercase">
            🔥 Sneakers Cases 🔥
          </Text>
          <Text className="text-black text-center mb-[20px] font-bold">
            Открой кейсы и получай вознаграждение
          </Text>

          {/* Заголовок с градиентом */}
          {/* <LinearGradient
            colors={["#8E44AD", "#3498DB", "#00FFAA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 24,
              marginBottom: 16,
            }}
            className="rounded-[16px] px-6 py-8 mb-6"
          >
            <Text className="text-[25px] font-bold text-white mb-1 text-center uppercase">
              Sneakers Cases
            </Text>
            <Text className="text-gray-200 text-center">
              Открой кейсы и получай вознаграждение
            </Text>
          </LinearGradient> */}

          {/* Промо-баннер */}
          <LinearGradient
            colors={["#8E44AD", "#3498DB", "#00FFAA"]}
            style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
          >
            <Text className="text-white text-xl font-bold mb-2 text-center">
              БЕСПЛАТНЫЙ КЕЙС
            </Text>
            <Text className="text-gray-300 text-center mb-4">
              Открывайте бесплатный кейс каждые 24 часа
            </Text>
            <View className="bg-black/30 rounded-full px-4 py-2 mb-4">
              <Text className="text-amber-300 text-center font-bold">
                Следующий кейс через: 03:42:18
              </Text>
            </View>
            <TouchableOpacity className="bg-amber-400 rounded-full py-3">
              <Text className="text-gray-900 text-center font-bold">
                ОТКРЫТЬ КЕЙС
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Список кейсов */}
          <View className="mb-8">
            {cases.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-xl mb-5"
              >
                {/* Полоса редкости */}
                <View className={`${getRarityColor(item.rarity)} px-4 py-2`}>
                  <Text className="text-center font-bold text-white">
                    {getRarityText(item.rarity)}
                  </Text>
                </View>

                {/* Контент кейса */}
                <View className="flex-row p-4 items-center">
                  {/* Изображение кейса */}
                  <View className="relative">
                    <Image
                      source={{
                        uri: item.imageUrl,
                      }}
                      className="w-24 h-24 rounded-xl"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Информация о кейсе */}
                  <View className="flex-1 ml-4">
                    <Text className="text-lg font-bold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 mt-1">
                      Содержит {item.itemsInside} пар
                    </Text>

                    <View className="flex-row justify-between items-center mt-3">
                      <Text className="text-xl font-bold text-gray-900">
                        {item.price} ₽
                      </Text>
                      <View
                        className={` ${caseBuyed(item) ? "bg-none" : "bg-green-500"} rounded-full px-3 py-1`}
                      >
                        <Text className="flex-row items-center space-x-1">
                          {caseBuyed(item) ? (
                            <View className="flex-row items-center gap-[5px]">
                              <Feather name="check" size={16} color="#22c55e" />{" "}
                              {/* green-500 */}
                              <Text className="text-green-500 text-[12.5px] font-bold">
                                КУПЛЕНО
                              </Text>
                            </View>
                          ) : (
                            <Text className="text-white text-xs font-bold">
                              НОВИНКА
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Кнопка покупки */}
                    <TouchableOpacity
                      onPress={() => handleBuyCase(item as SneakerCase)}
                      className={`mt-3 ${getRarityColor(item.rarity)} rounded-xl py-3 flex-row items-center justify-center gap-2`}
                    >
                      <Text className="text-white text-center font-bold text-base uppercase">
                        {caseBuyed(item) ? "ОТКРЫТЬ КЕЙС" : "КУПИТЬ"}{" "}
                      </Text>

                      {caseBuyed(item) && (
                        <FontAwesome5
                          name="lock-open"
                          size={17}
                          color="white"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Градиентная полоса статуса */}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CasesOpenPage;
