import Feather from "@expo/vector-icons/Feather";
import axios from "axios";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { useGetUser } from "@/hooks/useGetUser";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";

type Props = {};

const StoreFinancePage: React.FC<Props> = ({}) => {
  const { user } = useGetUser({});

  // from mokky server
  const [totalBudget, setTotalBudget] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // modal state
  const [withdrawAmountModal, setWithdrawAmountModal] = useState(false);
  // in modal select amount to withdraw
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const fetchBudgetData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(
        "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1"
      );
      setTotalBudget(res.data.store_budget);
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchCurrentMonthIncome = useCallback(async () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1; // JS: 0–11 → 1–12

    try {
      setIsRefreshing(true);

      // Получаем одиночный объект с настройками
      const res = await axios.get(
        "https://dcc2e55f63f7f47b.mokky.dev/app-settings/1"
      );
      const settings = res.data;

      // Берём массив месяцев
      const monthsIncomeArray = Array.isArray(settings.months_income)
        ? settings.months_income
        : [];

      // Ищем запись за текущий год и месяц
      const record = monthsIncomeArray.find(
        (item: { year: number; month: number; income: number }) =>
          item.year === thisYear && item.month === thisMonth
      );

      // fallback на store_budget или 0
      const rawIncome = record?.income ?? 0;

      // округляем и сохраняем
      const incomeRounded = Math.round(rawIncome);
      setCurrentMonthIncome(incomeRounded);
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useLayoutEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  useLayoutEffect(() => {
    fetchCurrentMonthIncome();
  }, [fetchCurrentMonthIncome]);

  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  const monthlyExpenses = Math.round(currentMonthIncome * 0.3);
  const profit = Math.round(currentMonthIncome - monthlyExpenses);

  // Заглушка обработки снятия
  const handleWithdraw = async (amount: number) => {
    if (amount > totalBudget) {
      Alert.alert("Ошибка", "Недостаточно средств");
      return;
    }

    if (!amount) {
      Alert.alert("Ошибка", "Введите корректную сумму");
      return;
    }

    try {
      await axios.patch("https://dcc2e55f63f7f47b.mokky.dev/app-settings/1", {
        store_budget: totalBudget - amount,
      });

      Alert.alert("Успех", "Средства успешно сняты");
      await axios.post("https://email-send-server.vercel.app/api/send-email", {
        amount,
      });
      fetchBudgetData();
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось снять средства");
      console.error(err);
    } finally {
      handleCloseWithdrawModal();
    }
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawAmountModal(false);
    setWithdrawAmount("");
  };

  if (user?.position !== "owner") return null;

  return (
    <>
      {withdrawAmountModal && (
        <Modal visible animationType="fade" transparent>
          {/* Затенённый фон */}
          <Pressable
            className="flex-1 justify-center items-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onPress={handleCloseWithdrawModal}
          >
            {/* Карточка модалки */}
            <Pressable onPress={() => {}}>
              <View className="w-11/12 max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
                {/* Хедер с градиентом */}
                <LinearGradient
                  colors={["#4C9EEB", "#367AD8"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  className="py-4 px-6"
                >
                  <Text className="text-center text-lg font-bold text-white">
                    Снять средства
                  </Text>
                </LinearGradient>

                <View className="p-6 gap-4">
                  {/* Описание */}
                  <Text className="text-center text-gray-600">
                    Введите сумму или снимите весь доступный баланс
                  </Text>

                  {/* Поле ввода с кнопкой "Вся сумма" */}
                  <View className="flex-row items-center gap-2">
                    <View className="relative flex-1">
                      <TextInput
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-lg text-gray-800"
                        placeholder="0"
                        keyboardType="numeric"
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                      />
                      <Text className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">
                        ₽
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="px-4 py-3 bg-indigo-50 rounded-lg shadow-inner"
                      onPress={() => setWithdrawAmount(totalBudget.toString())}
                    >
                      <Text className="text-blue-600 font-semibold">
                        Вся сумма
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Разделитель */}
                  <View className="h-px bg-gray-200" />

                  {/* Кнопки действий */}
                  <View className="flex-row justify-between gap-4">
                    <TouchableOpacity
                      className="flex-1 py-3 bg-gray-100 rounded-lg items-center"
                      onPress={handleCloseWithdrawModal}
                    >
                      <Text className="text-gray-700 font-medium">Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-3 bg-blue-600 rounded-lg items-center shadow"
                      onPress={() => {
                        handleWithdraw(Number(withdrawAmount));
                      }}
                    >
                      <Text className="text-white font-semibold">Снять</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <SafeAreaView className="flex-1 bg-gray-100">
        <ScrollView className="flex-1 p-4">
          <View className="flex-row items-start gap-4">
            {/* КНОПКА НАЗАД */}
            <Pressable
              onPress={() => router.push("/admin-panel")}
              className="bg-white w-10 h-10 items-center justify-center rounded-full shadow-md shadow-gray-300 active:opacity-60 mb-4"
            >
              <Feather name="arrow-left" size={20} color="#333" />
            </Pressable>

            {/* Заголовок */}
            <View className="mb-6">
              <Text className="text-[22px] font-bold text-gray-900">
                Финансы вашего магазина
              </Text>
              <Text className="text-gray-600 mt-1">Обзор бюджета и метрик</Text>
            </View>
          </View>

          {/* Карточка общего бюджета */}
          <View className="bg-white rounded-2xl p-6 shadow mb-6">
            <Text className="text-lg font-semibold text-gray-700">
              Общий бюджет
            </Text>
            <Text className="text-4xl font-bold text-green-600 mt-2">
              {totalBudget.toLocaleString()} ₽
            </Text>

            {/* КНОПКА: ПЕРЕВЕСТИ СУММУ */}
            <TouchableOpacity
              onPress={() => {
                setWithdrawAmountModal(true);
              }}
              className="mt-4 bg-green-100 px-4 py-3 rounded-xl active:opacity-70 flex-row items-center justify-center gap-[8px]"
            >
              {/* <FontAwesome6
              name="money-bill-transfer"
              size={20}
              color="#16a34a"
            /> */}
              <Text className="text-green-600 text-base font-semibold">
                Снять сумму
              </Text>
              <AntDesign name="arrowright" size={24} color="#16a34a" />
            </TouchableOpacity>
          </View>

          {/* Статистика месяца */}
          <View className="bg-white rounded-2xl p-6 shadow mb-6">
            <Text className="text-lg font-semibold text-gray-700 mb-4">
              Статистика за месяц
            </Text>
            <View className="flex-row justify-between">
              <View className="items-start">
                <Text className="text-sm text-gray-500">Доход</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-1">
                  {currentMonthIncome.toLocaleString()} ₽
                </Text>
              </View>
              <View className="items-start">
                <Text className="text-sm text-gray-500">Расходы</Text>
                <Text className="text-2xl font-bold text-red-600 mt-1">
                  {monthlyExpenses.toLocaleString()} ₽
                </Text>
              </View>
              <View className="items-start">
                <Text className="text-sm text-gray-500">Прибыль</Text>
                <Text className="text-2xl font-bold text-green-600 mt-1">
                  {profit.toLocaleString()} ₽
                </Text>
              </View>
            </View>
          </View>

          {/* Дополнительные показатели */}
          <View>
            <Text className="text-lg font-semibold text-gray-700 mb-4">
              Показатели
            </Text>
            {/* Пример кнопок-фильтров */}
            <View className="flex-row mb-4 space-x-3 gap-[10px]">
              <TouchableOpacity className="bg-green-100 px-4 py-2 rounded-full">
                <Text className="text-green-800">Год</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-blue-100 px-4 py-2 rounded-full">
                <Text className="text-blue-800">Квартал</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-full">
                <Text className="text-gray-700">Месяц</Text>
              </TouchableOpacity>
            </View>

            {/* Заглушка для графика */}
            <View className="h-40 bg-white rounded-2xl shadow flex items-center justify-center">
              <Text className="text-gray-400">Здесь будет график</Text>
            </View>
          </View>

          {/* Кнопка действий */}
          <View className="mt-8 mb-4">
            <TouchableOpacity
              onPress={() => {
                fetchBudgetData();
                fetchCurrentMonthIncome();
              }}
              disabled={isRefreshing}
              className={`py-3 rounded-xl shadow flex-row justify-center items-center ${
                isRefreshing ? "bg-gray-300" : "bg-blue-600"
              }`}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center text-white font-semibold">
                  Обновить данные
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default StoreFinancePage;
