// SingleAuctionScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams } from "expo-router";
import { useGetUser } from "@/hooks/useGetUser";
import { setUpdateAuction } from "@/redux/slices/auction.slice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";

/** =========================
 * Типы
 * ========================= */
type AuctionBet = { userId: number; price: number };
type AuctionItem = {
  id: number;
  title: string;
  imageUrl: string;
  startPrice: number;
  currentPrice: number;
  endTime: string; // ISO
  bets: AuctionBet[];
};
type User = {
  id: number;
  name: string;
  lastName?: string;
  avatarUri?: string;
};

/** =========================
 * Константы
 * ========================= */
const API_AUCTION = "https://dcc2e55f63f7f47b.mokky.dev/auction";
const API_USERS = "https://dcc2e55f63f7f47b.mokky.dev/users";

// Кто сейчас делает ставку (поменяй под своего авторизованного пользователя)

/** =========================
 * Хелперы
 * ========================= */
const priceFmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const diffParts = (endIso: string) => {
  const now = Date.now();
  const end = new Date(endIso).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
  const secs = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, mins, secs, ms: diff };
};

const fmtLeft = (endIso: string) => {
  const { days, hours, mins, secs } = diffParts(endIso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return days > 0
    ? `${days}д ${pad(hours)}:${pad(mins)}:${pad(secs)}`
    : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

function byPriceAsc(a: AuctionBet, b: AuctionBet) {
  return a.price - b.price;
}

/** =========================
 * Экран
 * ========================= */

const SingleAuctionScreen: React.FC = () => {
  // Если используешь expo-router, можно забрать id так:
  // const { id } = useLocalSearchParams<{ id: string }>();
  // const idNum = id ? Number(id) : auctionId;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const idNum = Number(id);
  const dispatch = useDispatch();
  const { updateAuction } = useSelector((state: RootState) => state.auction);

  const { user } = useGetUser({});

  const CURRENT_USER_ID = user?.id || 0;

  const [item, setItem] = useState<AuctionItem | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [myBid, setMyBid] = useState("");

  const [tick, setTick] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const intervalId = setInterval(
      () => setTick((t) => (t + 1) % 1_000_000),
      1000
    ) as any;

    return () => {
      // Cleanup function
      clearInterval(intervalId);
    };
  }, []);
  const left = useMemo(
    () => (item ? fmtLeft(item.endTime) : ""),
    [item?.endTime, tick]
  );
  const leftMs = useMemo(
    () => (item ? diffParts(item.endTime).ms : 0),
    [item?.endTime, tick]
  );
  const ended = leftMs <= 0;

  const usersMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const leaderPrice = useMemo(
    () =>
      item ? Math.max(item.currentPrice, ...item.bets.map((b) => b.price)) : 0,
    [item]
  );
  const sortedBets = useMemo(
    () => (item ? [...item.bets].sort(byPriceAsc) : []),
    [item]
  );

  /** загрузка аукциона + пользователей */
  const load = async () => {
    try {
      setLoading(true);
      const [itemRes, usersRes] = await Promise.all([
        axios.get<AuctionItem>(`${API_AUCTION}/${idNum}`),
        axios.get<User[]>(API_USERS),
      ]);
      setItem(itemRes.data);
      setUsers(usersRes.data);
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось загрузить лот/пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [idNum]);

  /** сделать ставку */
  const placeBid = async () => {
    if (!item) return;
    if (ended)
      return Alert.alert(
        "Аукцион завершён",
        "Нельзя сделать ставку после завершения."
      );
    const value = Number(myBid.replace(/\s/g, ""));
    if (!Number.isFinite(value) || value <= 0)
      return Alert.alert("Ошибка", "Введи корректную сумму.");
    if (value <= item.currentPrice) {
      return Alert.alert(
        "Ставка слишком маленькая",
        `Нужно больше чем ${priceFmt(item.currentPrice)} ₽`
      );
    }

    // Оптимистично обновим
    const next: AuctionItem = {
      ...item,
      currentPrice: value,
      bets: [...item.bets, { userId: CURRENT_USER_ID, price: value }],
    };

    try {
      setPlacing(true);
      setItem(next);
      setMyBid("");

      await axios.patch(`${API_AUCTION}/${item.id}`, {
        currentPrice: value,
        bets: next.bets,
      });

      await axios.patch(
        `https://dcc2e55f63f7f47b.mokky.dev/users/${user?.id}`,
        {
          balance: user && user.balance - value,
        }
      );

      dispatch(setUpdateAuction(!updateAuction));
    } catch (e) {
      // Откат
      setItem(item);
      Alert.alert("Ошибка", "Не удалось поставить ставку. Повтори позже.");
    } finally {
      setPlacing(false);
    }
  };

  /** UI */
  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 bg-white items-center justify-center"
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-neutral-500">Загрузка…</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 bg-white items-center justify-center px-6"
      >
        <Text className="text-center text-neutral-500">Лот не найден</Text>
        <TouchableOpacity
          onPress={load}
          className="mt-3 rounded-xl bg-blue-500 px-4 py-3"
          activeOpacity={0.9}
        >
          <Text className="font-bold text-white">Повторить</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          {/* Header */}
          <View className="mb-3">
            <Text className="text-2xl font-extrabold text-neutral-900">
              {item.title}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Лот #{item.id}
            </Text>
          </View>

          {/* Изображение */}
          <View className="mb-4 h-64 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
            <Image
              source={{ uri: item.imageUrl }}
              className="h-full w-full"
              resizeMode="contain"
            />
          </View>

          {/* Инфо о цене/таймере */}
          <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-xs text-neutral-500">Текущая цена</Text>
                <Text className="text-2xl font-extrabold text-blue-600">
                  {priceFmt(item.currentPrice)} ₽
                </Text>
              </View>
              <View>
                <Text className="text-xs text-neutral-500">Старт</Text>
                <Text className="text-base font-semibold text-neutral-800">
                  {priceFmt(item.startPrice)} ₽
                </Text>
              </View>
            </View>

            <View className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
              {/* Простейший таймер-прогресс от старта к финишу (48ч если хочешь — можно хранить в item) */}
              <View
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: (() => {
                    const total = 48 * 3600 * 1000; // эвристика
                    const leftMsLocal = leftMs;
                    const passed = Math.min(
                      total,
                      Math.max(0, total - leftMsLocal)
                    );
                    return `${Math.round((passed / total) * 100)}%`;
                  })(),
                }}
              />
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                <Text className="text-xs text-neutral-700">
                  ⏳ Осталось: {left}
                </Text>
              </View>
              {ended ? (
                <View className="rounded-full bg-red-50 px-3 py-1">
                  <Text className="text-xs font-semibold text-red-500">
                    Аукцион завершён
                  </Text>
                </View>
              ) : (
                <View className="rounded-full bg-emerald-50 px-3 py-1">
                  <Text className="text-xs font-semibold text-emerald-600">
                    Идёт торг
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* История ставок */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-bold text-neutral-900">
              История ставок
            </Text>

            {sortedBets.length === 0 ? (
              <View className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
                <Text className="text-neutral-500">
                  Ставок ещё нет. Будь первым!
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {sortedBets.map((b, idx) => {
                  const prev = idx === 0 ? null : sortedBets[idx - 1];
                  const delta = prev
                    ? b.price - prev.price
                    : b.price - item.startPrice;
                  const u = usersMap.get(b.userId);
                  const isLeader = b.price === leaderPrice;

                  return (
                    <View
                      key={`${b.userId}-${b.price}-${idx}`}
                      className={`flex-row items-center rounded-2xl border p-3 ${
                        isLeader
                          ? "border-blue-300 bg-blue-50"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <View className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                        <Image
                          source={{
                            uri:
                              u?.avatarUri ||
                              "https://avatars.githubusercontent.com/u/583231?v=4",
                          }}
                          className="h-full w-full"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[13px] font-semibold text-neutral-900">
                          {u
                            ? `${u.name} ${u.lastName ?? ""}`.trim()
                            : `User #${b.userId}`}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          Ставка:{" "}
                          <Text className="font-semibold text-neutral-800">
                            {priceFmt(b.price)} ₽
                          </Text>
                          {idx > 0 || b.price > item.startPrice ? (
                            <Text className="text-xs text-neutral-500">{`  •  перебил на ${priceFmt(Math.max(0, delta))} ₽`}</Text>
                          ) : null}
                        </Text>
                      </View>
                      {isLeader ? (
                        <View className="rounded-full bg-blue-500 px-2 py-1">
                          <Text className="text-[11px] font-bold text-white">
                            Лидер
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Форма ставки */}
          {user ? (
            <View className="rounded-2xl border border-neutral-200 bg-white p-4">
              <Text className="mb-2 text-base font-bold text-neutral-900">
                Сделать ставку
              </Text>
              <Text className="mb-3 text-xs text-neutral-500">
                Введи сумму больше {priceFmt(item.currentPrice)} ₽, чтобы
                перебить текущего лидера.
              </Text>

              <View className="flex-row items-center">
                <View className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2">
                  <TextInput
                    placeholder={`${item.currentPrice + 1}`}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={myBid}
                    onChangeText={(v) => setMyBid(v.replace(/[^\d\s]/g, ""))}
                    className="text-base text-neutral-900"
                  />
                </View>

                <TouchableOpacity
                  onPress={placeBid}
                  disabled={placing || ended}
                  activeOpacity={0.9}
                  className={`ml-2 rounded-xl px-4 py-3 ${ended ? "bg-neutral-300" : "bg-blue-500"} ${placing ? "opacity-60" : ""}`}
                >
                  {placing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="font-bold text-white">Поставить</Text>
                  )}
                </TouchableOpacity>
              </View>

              {ended ? (
                <Text className="mt-2 text-xs font-semibold text-red-500">
                  Торги завершены — ставки недоступны.
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4">
              <Link
                href="/login"
                className="mb-2 text-base font-bold text-neutral-900 underline"
              >
                Войдите, чтобы сделать ставку
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SingleAuctionScreen;
