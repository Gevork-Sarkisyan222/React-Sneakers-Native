import React, { useEffect, useLayoutEffect } from "react";
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
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useGetUser } from "@/hooks/useGetUser";
import { router } from "expo-router";
import { SneakerCase } from "@/constants/Types";
import { cases } from "@/constants/cases";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { sendToFinance } from "@/utils/finance";

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
  const updateCases = useSelector(
    (state: RootState) => state.products.updateCases
  );

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
  }, [updateCases]);

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

              await sendToFinance(item.price);

              // 1. Получаем текущий бюджет

              // const res = await axios.get(
              //   "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1"
              // );
              // const currentBudget = res.data.store_budget || 0;

              // const buyedCasePrice = item.price;

              // // 2. Прибавляем новую сумму
              // const updatedBudget = currentBudget + buyedCasePrice;

              // // 3. Обновляем бюджет
              // await axios.patch(
              //   "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1",
              //   {
              //     store_budget: updatedBudget,
              //   }
              // );

              // const today = new Date();
              // const thisYear = today.getFullYear();
              // const thisMonth = today.getMonth() + 1; // JS: 0–11 → 1–12

              // // Получаем одиночный объект с настройками
              // const monthRes = await axios.get(
              //   "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1"
              // );
              // const settings = monthRes.data;

              // // Берём массив месяцев
              // const monthsIncomeArray = Array.isArray(settings.months_income)
              //   ? settings.months_income
              //   : [];

              // // Ищем запись за текущий год и месяц
              // const findedRecord = monthsIncomeArray.find(
              //   (item: { year: number; month: number; income: number }) =>
              //     item.year === thisYear && item.month === thisMonth
              // );

              // // вычисляем новый массив months_income
              // const updatedMonthsIncome = findedRecord
              //   ? monthsIncomeArray.map((item: any) =>
              //       item.year === thisYear && item.month === thisMonth
              //         ? {
              //             ...item,
              //             income: item.income + buyedCasePrice,
              //           }
              //         : item
              //     )
              //   : [
              //       ...monthsIncomeArray,
              //       {
              //         year: thisYear,
              //         month: thisMonth,
              //         income: buyedCasePrice,
              //       },
              //     ];

              // // один PATCH-запрос
              // await axios.patch(
              //   "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1",
              //   {
              //     months_income: updatedMonthsIncome,
              //   }
              // );

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
    return buyedCases.find(
      (caseItem) =>
        caseItem.rarity === item.rarity && caseItem.type === item.type
    );
  };

  const [showFreeCase, setShowFreeCase] = React.useState(false);

  const [timeToOpenFreeCaseMs, setTimeToOpenFreeCaseMs] =
    React.useState<number>(0); // в мс
  const [countdown, setCountdown] = React.useState<string>("00:00:00");

  const checkFreeCaseDate = async () => {
    try {
      // 1. Получаем текущее время в миллисекундах
      const nowMs = Date.now();

      // 2. Запрашиваем из API ISO‑строку с целью
      const res = await axios.get(
        "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1"
      );
      const isoString: string = res.data.timeToOpenFreeCase;

      // 3. Парсим её в миллисекунды и сохраняем для таймера
      const targetMs = Date.parse(isoString);
      setTimeToOpenFreeCaseMs(targetMs);

      // 4. Сравниваем, если сейчас >= цели — кейс доступен
      if (nowMs >= targetMs) {
        setShowFreeCase(true);
      } else {
        setShowFreeCase(false);
      }
    } catch (error) {
      console.error("Ошибка при проверке даты free case:", error);
      setShowFreeCase(false);
    }
  };

  useEffect(() => {
    checkFreeCaseDate();
    // te guzes hane зависимостн-eren updateCases
  }, [updateCases]);

  const handleAddFreeCase = async (item: SneakerCase) => {
    try {
      // Получаем все кейсы
      const res = await axios.get("https://dcc2e55f63f7f47b.mokky.dev/cases");
      const existingCases: SneakerCase[] = res.data;

      // Проверяем: есть ли уже такой бесплатный кейс с той же редкостью
      const alreadyExists = existingCases.some(
        (c) => c.rarity === item.rarity && c.type === "free"
      );

      if (alreadyExists) {
        console.log("Такой бесплатный кейс уже добавлен.");
        return;
      }

      // Добавляем кейс, если его нет
      await axios.post("https://dcc2e55f63f7f47b.mokky.dev/cases", item);
      console.log("Бесплатный кейс успешно добавлен.");
    } catch (err) {
      console.error("Ошибка при добавлении бесплатного кейса:", err);
    }
  };

  React.useEffect(() => {
    if (!timeToOpenFreeCaseMs) return;

    const pad = (n: number) => String(n).padStart(2, "0");

    const interval = setInterval(() => {
      const diff = timeToOpenFreeCaseMs - Date.now();
      if (diff <= 0) {
        // время наступило
        setShowFreeCase(true);
        setCountdown("00:00:00");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1000);
        setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeToOpenFreeCaseMs]);

  const commonCase = cases.find(
    (item) => item.rarity === "common" && item.type === "free"
  );

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
              onRefresh={() => {
                checkFreeCaseDate();
                fetchBuyedCases();
              }}
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
                {!showFreeCase
                  ? `Следующий кейс через: ${countdown}`
                  : "Кейс доступен!"}
              </Text>
            </View>
            {showFreeCase && commonCase && (
              <TouchableOpacity
                onPress={async () => {
                  await handleAddFreeCase(commonCase);
                  router.push({
                    pathname: "/case/[rarity]",
                    params: { rarity: "common", type: "free" },
                  }); // затем перейти
                }}
                className="bg-amber-400 rounded-full py-3"
              >
                <Text className="text-gray-900 text-center font-bold">
                  ОТКРЫТЬ КЕЙС
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* Список кейсов */}
          <View className="mb-8">
            {isLoading ? (
              <RenderCaseSkeleton />
            ) : (
              cases
                .filter((item) => item.type !== "free")
                .map((item) => (
                  <View
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-xl mb-5"
                  >
                    {/* Полоса редкости */}
                    <View
                      className={`${getRarityColor(item.rarity)} px-4 py-2`}
                    >
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
                                  params: {
                                    rarity: item.rarity.toString(),
                                    type: "paid",
                                  },
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
