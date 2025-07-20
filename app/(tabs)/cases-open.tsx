import React, { use, useLayoutEffect } from "react";
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
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useGetUser } from "@/hooks/useGetUser";
import { router } from "expo-router";
import { SneakerCase } from "@/constants/Types";

const RenderCaseSkeleton = () => {
  return Array.from({ length: 4 }).map((_, index) => (
    <View
      key={index}
      className="bg-white rounded-2xl overflow-hidden shadow-xl mb-5"
    >
      {/* Верхняя полоса (редкость) */}
      <View className="bg-gray-300 px-4 py-2" />

      <View className="flex-row p-4 items-center">
        {/* Имитация изображения */}
        <View className="w-24 h-24 rounded-xl bg-gray-200 animate-pulse" />

        <View className="flex-1 ml-4">
          {/* Название */}
          <View className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          {/* Текст ниже */}
          <View className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />

          {/* Цена и метка */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            <View className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          </View>

          {/* Кнопка */}
          <View className="h-10 bg-gray-300 rounded-xl animate-pulse" />
        </View>
      </View>
    </View>
  ));
};

const CasesOpenPage = () => {
  const { user } = useGetUser({});
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
      itemsInside: 19,
      imageUrl:
        "https://images.meesho.com/images/products/534430220/ixjox_512.webp",
      items: [
        {
          item_id: 1,
          item_title: "500 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 500,
          item_rarity: "common",
        },
        {
          item_id: 2,
          item_title: "Мужские Кроссовки Nike Air Max 275",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/126/31109902_940x940.webp?v=1744360723",
          item_price: 3999,
          item_rarity: "rare",
        },
        {
          item_id: 3,
          item_title: "1000 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 1000,
          item_rarity: "common",
        },
        {
          item_id: 4,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2500,
          item_rarity: "common",
        },
        {
          item_id: 5,
          item_title: "Ничего не выиграл",
          item_imageUrl:
            "https://media.istockphoto.com/id/1667499762/ru/векторная/открытая-картонная-коробка.jpg?s=612x612&w=0&k=20&c=rwu4QQDiUIJiV5uhieMXdXJlaj638I4FGHqWJwt2sTI=",
          item_price: 0,
          item_rarity: "common",
        },
        {
          item_id: 6,
          item_title: "4000 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 4000,
          item_rarity: "rare",
        },
        {
          item_id: 7,
          item_title: "Кроссовки Style Rider Hyper Prep",
          item_imageUrl:
            "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/405745/01/fnd/PNA/fmt/png/Style-Rider-Hyper-Prep",
          item_price: 3500,
          item_rarity: "common",
        },
        {
          item_id: 8,
          item_title: "Кроссовки KING 21",
          item_imageUrl:
            "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/106696/01/fnd/PNA/fmt/png/KING-21-IT-Unisex",
          item_price: 2599,
          item_rarity: "common",
        },
        {
          item_id: 9,
          item_title: "Кроссовки GV Special",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39837402_940x940.webp?v=1744364040",
          item_price: 5999,
          item_rarity: "epic",
        },
        {
          item_id: 10,
          item_title: "300 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 300,
          item_rarity: "common",
        },
        {
          item_id: 11,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2500,
          item_rarity: "common",
        },
        {
          item_id: 12,
          item_title: "3000 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 3000,
          item_rarity: "rare",
        },
        {
          item_id: 13,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2500,
          item_rarity: "common",
        },
        {
          item_id: 14,
          item_title: "Ничего не выиграл",
          item_imageUrl:
            "https://media.istockphoto.com/id/1667499762/ru/векторная/открытая-картонная-коробка.jpg?s=612x612&w=0&k=20&c=rwu4QQDiUIJiV5uhieMXdXJlaj638I4FGHqWJwt2sTI=",
          item_price: 0,
          item_rarity: "common",
        },
        {
          item_id: 15,
          item_title: "Кроссовки Scend Pro WTR PUMA Black-PUMA Silver",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/96/31039901_940x940.webp?v=1744361177",
          item_price: 7999,
          item_rarity: "epic",
        },
        {
          item_id: 16,
          item_title: "All-Pro NITRO™ 2 Shammgod",
          item_imageUrl:
            "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/312308/01/fnd/PNA/fmt/png/All-Pro-NITRO%E2%84%A2-2-Shammgod",
          item_price: 3100,
          item_rarity: "common",
        },
        {
          item_id: 17,
          item_title: "Кроссовки Clyde Club Las Vegas",
          item_imageUrl:
            "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/404670/01/fnd/PNA/fmt/png/Clyde-Club-Flagship-Unisex",
          item_price: 2999,
          item_rarity: "common",
        },
        {
          item_id: 18,
          item_title: "1000 ₽",
          item_imageUrl:
            "https://cdn-icons-png.flaticon.com/512/7630/7630510.png",
          item_price: 1000,
          item_rarity: "common",
        },
        {
          item_id: 19,
          item_title: "Ничего не выиграл",
          item_imageUrl:
            "https://media.istockphoto.com/id/1667499762/ru/векторная/открытая-картонная-коробка.jpg?s=612x612&w=0&k=20&c=rwu4QQDiUIJiV5uhieMXdXJlaj638I4FGHqWJwt2sTI=",
          item_price: 0,
          item_rarity: "common",
        },
      ],
    },
    {
      id: "2",
      title: "Лимитированный Кейс",
      rarity: "legendary",
      price: 11999,
      itemsInside: 3,
      imageUrl:
        "https://media.istockphoto.com/id/1471122805/photo/pair-of-yellow-sneakers-on-yellow-background-copy-space.jpg?s=612x612&w=0&k=20&c=BxoQVxQMfjSGBxAlcqHVIHjKOqiVnnwbelmvs9-Xq6k=",
      items: [
        {
          item_id: 1,
          item_title: "Мужские Кроссовки Nike Air Max 275",
          item_imageUrl:
            "https://store-sneakers-vue.vercel.app/sneakers/sneakers-2.jpg",
          item_price: 3999,
          item_rarity: "common",
        },
        {
          item_id: 2,
          item_title: "Кроссовки Scend Pro WTR PUMA Black-PUMA Silver",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/96/31039901_940x940.webp?v=1744361177",
          item_price: 4970,
          item_rarity: "common",
        },
        {
          item_id: 3,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2599,
          item_rarity: "common",
        },
      ],
    },
    {
      id: "3",
      title: "Редкий Кейс",
      rarity: "rare",
      price: 8999,
      itemsInside: 3,
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfY15nTEavNrnRDE2_--mbMuol1ZRtzcNKuA&s",
      items: [
        {
          item_id: 1,
          item_title: "Мужские Кроссовки Nike Air Max 275",
          item_imageUrl:
            "https://store-sneakers-vue.vercel.app/sneakers/sneakers-2.jpg",
          item_price: 3999,
          item_rarity: "common",
        },
        {
          item_id: 2,
          item_title: "Кроссовки Scend Pro WTR PUMA Black-PUMA Silver",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/96/31039901_940x940.webp?v=1744361177",
          item_price: 4970,
          item_rarity: "common",
        },
        {
          item_id: 3,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2599,
          item_rarity: "common",
        },
      ],
    },
    {
      id: "4",
      title: "Премиум Кейс",
      rarity: "epic",
      price: 16999,
      itemsInside: 3,
      imageUrl:
        "https://brand.assets.adidas.com/image/upload/f_auto,q_auto:best,fl_lossy/if_w_gt_800,w_800/shoes_men_tcc_d_44a809233a.jpg",
      items: [
        {
          item_id: 1,
          item_title: "Мужские Кроссовки Nike Air Max 275",
          item_imageUrl:
            "https://store-sneakers-vue.vercel.app/sneakers/sneakers-2.jpg",
          item_price: 3999,
          item_rarity: "common",
        },
        {
          item_id: 2,
          item_title: "Кроссовки Scend Pro WTR PUMA Black-PUMA Silver",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/96/31039901_940x940.webp?v=1744361177",
          item_price: 4970,
          item_rarity: "common",
        },
        {
          item_id: 3,
          item_title: "Кроссовки Easy Rider Mix PUMA White-PUMA Black",
          item_imageUrl:
            "https://pumageorgia.ge/uploads/md/webp/127/39902501_940x940.webp?v=1744365729",
          item_price: 2599,
          item_rarity: "common",
        },
      ],
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
    if (!item || !user) return;

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
              setIsLoading(true);

              if (user.balance < item.price)
                return Alert.alert("Ошибка", "Недостаточно средств");

              await axios.post(
                "https://dcc2e55f63f7f47b.mokky.dev/cases",
                item
              );

              await axios.patch(
                `https://dcc2e55f63f7f47b.mokky.dev/users/${user?.id}`,
                {
                  balance: user?.balance - item.price,
                }
              );

              Alert.alert(
                "Успех",
                `${item.title} успешно куплен за ${item.price} ₽`
              );
              fetchBuyedCases();
            } catch (err) {
              console.error(err);
              Alert.alert("Ошибка", "Не удалось купить кейс");
            } finally {
              setIsLoading(false);
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
          refreshControl={
            <RefreshControl
              colors={["#338fd4"]}
              refreshing={isLoading}
              onRefresh={fetchBuyedCases}
            />
          }
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
            {isLoading ? (
              <RenderCaseSkeleton />
            ) : (
              cases.map((item) => (
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
                                <Feather
                                  name="check"
                                  size={16}
                                  color="#22c55e"
                                />{" "}
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
                        onPress={() =>
                          caseBuyed(item)
                            ? router.push({
                                pathname: "/case/[rarity]",
                                params: { rarity: item.rarity.toString() },
                              })
                            : handleBuyCase(item)
                        }
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
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CasesOpenPage;
