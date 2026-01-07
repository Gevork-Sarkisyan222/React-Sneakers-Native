import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useGetUser } from '@/hooks/useGetUser';
import { UserInterface } from '@/constants/Types';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useSettleEndedAuctions } from '@/hooks/useSettleEndedAuctions';

/** =========================
 * Типы
 * ========================= */
type AuctionBet = {
  userId: number;
  price: number;
};

type AuctionItem = {
  id: number;
  title: string;
  imageUrl: string;
  startPrice: number;
  currentPrice: number;
  endTime: string; // ISO
  bets: AuctionBet[];
};

const API_URL = 'https://dcc2e55f63f7f47b.mokky.dev/auction';

/** =========================
 * Хелперы
 * ========================= */
const price = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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
  const pad = (n: number) => String(n).padStart(2, '0');
  return days > 0
    ? `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`
    : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

/** =========================
 * Палитра (основной — индиго)
 * ========================= */
const PRIMARY = {
  bg: 'bg-blue-500',
  bgHover: 'bg-blue-500',
  textOn: 'text-white',
  ring: 'bg-blue-500',
};

/** =========================
 * Модалка создания лота
 * ========================= */
type CreateModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (created: AuctionItem) => void;
};

const CreateAuctionModal: React.FC<CreateModalProps> = ({ visible, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setTitle('');
      setImageUrl('');
      setStartPrice('');
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const previewOk = /^https?:\/\//i.test(imageUrl);

  const handleSubmit = async () => {
    setError(null);
    const t = title.trim();
    const img = imageUrl.trim();
    const sp = Number(startPrice.replace(/\s/g, ''));

    if (t.length < 2) return setError('Enter a title (at least 2 characters).');
    if (!/^https?:\/\//i.test(img)) return setError('Provide a valid Image URL (http/https).');
    if (!Number.isFinite(sp) || sp <= 0) return setError('Starting price must be > 0.');

    const payload = {
      title: t,
      imageUrl: img,
      startPrice: sp,
      currentPrice: sp,
      endTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      bets: [] as AuctionBet[],
    };

    try {
      setSubmitting(true);
      const { data } = await axios.post<AuctionItem>(API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      onCreated(data);
      onClose();
    } catch (e) {
      setError('Error while creating. Check your connection or try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full">
          <View className="w-full rounded-2xl border border-neutral-200 bg-white p-4">
            <Text className="mb-3 text-lg font-extrabold text-neutral-900">Create lot</Text>

            <Text className="mb-1 text-xs text-neutral-500">Title</Text>
            <TextInput
              placeholder="Jordan Shoes"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
              className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-neutral-900"
            />

            <Text className="mb-1 text-xs text-neutral-500">Image URL</Text>
            <TextInput
              placeholder="https://…"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              value={imageUrl}
              onChangeText={setImageUrl}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-neutral-900"
            />

            {previewOk ? (
              <View className="my-3 h-40 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="contain" />
              </View>
            ) : (
              <View className="my-3 h-36 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
                <Text className="text-neutral-400">Image preview</Text>
              </View>
            )}

            <Text className="mb-1 text-xs text-neutral-500">Starting price</Text>
            <TextInput
              placeholder="10000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={startPrice}
              onChangeText={(v) => {
                const cleaned = v.replace(/[^\d\s]/g, '');
                setStartPrice(cleaned);
              }}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-neutral-900"
            />

            <Text className="mt-2 text-[11px] text-neutral-500">
              * When created, the current price equals the starting price. Bids are empty.
            </Text>

            {error ? <Text className="mt-2 text-red-500">{error}</Text> : null}

            <View className="mt-4 flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3"
                activeOpacity={0.8}>
                <Text className="font-bold text-neutral-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className={`rounded-xl px-4 py-3 ${PRIMARY.bg}`}
                activeOpacity={0.9}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-bold ${PRIMARY.textOn}`}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

/** =========================
 * Карточка аукциона
 * ========================= */
const AuctionCard: React.FC<{ item: AuctionItem }> = ({ item }) => {
  const [tick, setTick] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 1000) as any;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const left = useMemo(() => fmtLeft(item.endTime), [item.endTime, tick]);
  const leftMs = useMemo(() => diffParts(item.endTime).ms, [item.endTime, tick]);
  const ended = leftMs <= 0;

  // Прогресс (0..1)
  const progress = useMemo(() => {
    const total = 48 * 3600 * 1000; // если у тебя другое окно — вынеси в поле
    const passed = clamp(total - leftMs, 0, total);
    return ended ? 1 : passed / total;
  }, [leftMs, ended]);

  const router = useRouter();
  const handleRedirect = () => {
    if (ended) return; // блокируем переход после завершения
    router.push({
      pathname: '/auction-card/[id]',
      params: { id: String(item.id) },
    });
  };

  const [users, setUsers] = useState<UserInterface[]>([]);

  useEffect(() => {
    // грузим список пользователей 1 раз
    axios
      .get<UserInterface[]>('https://dcc2e55f63f7f47b.mokky.dev/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  const usersMap = useMemo(() => {
    const m = new Map<number, UserInterface>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const winnerBet =
    item.bets && item.bets.length ? item.bets.reduce((a, b) => (a.price >= b.price ? a : b)) : null;

  const u = winnerBet ? usersMap.get(winnerBet.userId) : null;
  const fullName = u
    ? `${u.name ?? 'User'} ${u.lastName ?? ''}`.trim()
    : winnerBet
      ? `User #${winnerBet.userId}`
      : '';

  return (
    <TouchableOpacity
      activeOpacity={ended ? 1 : 0.9}
      onPress={handleRedirect}
      disabled={ended}
      className={`rounded-2xl border p-3 shadow-sm ${
        ended ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-200 bg-white'
      }`}>
      {/* Image + badges */}
      <View className="relative mb-3 h-40 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        <Image
          source={{ uri: item.imageUrl }}
          className={`h-full w-full ${ended ? 'opacity-70' : ''}`}
          resizeMode="contain"
        />

        {/* Ribbon/badge “Ended” */}
        {ended && (
          <>
            <View className="absolute left-2 top-2 rounded-full bg-red-500/90 px-3 py-1">
              <Text className="text-xs font-bold text-white">Auction ended</Text>
            </View>

            {/* light overlay on top */}
            <View className="absolute inset-0 bg-white/20" pointerEvents="none" />
          </>
        )}
      </View>

      {ended && (
        <Text className="text-[13px] font-bold text-black">
          {/* The one who won the item */}
          {winnerBet ? `Winner: ${fullName} — ${price(winnerBet.price)} ₽` : 'Winner: no bids'}
        </Text>
      )}

      {/* Text part */}
      <View className="space-y-1">
        <Text numberOfLines={1} className="text-base font-bold text-neutral-900">
          {item.title}
        </Text>

        <View className="flex-row items-center space-x-2">
          <Text className="text-[13px] text-neutral-500">{ended ? 'Final:' : 'Current:'}</Text>
          <Text
            className={`text-[16px] font-extrabold ${ended ? 'text-neutral-800' : 'text-emerald-600'}`}>
            {price(item.currentPrice)} ₽
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <Text className="text-xs text-neutral-500">Start:</Text>
          <Text className="text-xs text-neutral-700">{price(item.startPrice)} ₽</Text>
        </View>

        {/* Progress bar */}
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
          <View
            className={`h-full rounded-full ${ended ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>

        {/* Bottom of the card */}
        <View className="mt-3 flex-row items-center justify-between">
          <View
            className={`rounded-full border px-3 py-1 ${
              ended ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-neutral-50'
            }`}>
            <Text
              className={`text-xs ${ended ? 'font-semibold text-red-600' : 'text-neutral-700'}`}>
              {ended ? '⛔ Ended' : `⏳ ${left}`}
            </Text>
          </View>

          <View className="rounded-full border border-neutral-200 bg-white px-3 py-1">
            <Text className="text-xs text-neutral-700">🥊 Bids: {item.bets?.length ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/** =========================
 * Главный экран
 * ========================= */
const AuctionPage: React.FC = () => {
  const { user } = useGetUser({});
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateAuction } = useSelector((state: RootState) => state.auction);

  const load = async () => {
    setError(null);
    try {
      setLoading(true);
      const { data } = await axios.get<AuctionItem[]>(API_URL);
      const sorted = [...data].sort(
        (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
      );
      setItems(sorted);
    } catch {
      setError('Не удалось загрузить аукционы. Проверь подключение.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.get<AuctionItem[]>(API_URL);
      const sorted = [...data].sort(
        (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
      );
      setItems(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [updateAuction]);

  // useSettleEndedAuctions();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView>
        <View className="px-4 pt-2 pb-1">
          <Text className="text-2xl font-extrabold text-neutral-900">Auctions</Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Time to act — place a bid and watch!
          </Text>
        </View>

        {loading ? (
          <View className="items-center justify-center px-6 py-8">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-2 text-neutral-400">Loading…</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center px-6 py-8">
            <Text className="text-center text-red-500">{error}</Text>
            <TouchableOpacity
              onPress={load}
              className={`mt-3 rounded-xl px-4 py-3 ${PRIMARY.bg}`}
              activeOpacity={0.9}>
              <Text className={`font-bold ${PRIMARY.textOn}`}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View className="items-center justify-center px-6 py-8">
            <Text className="mb-2 text-neutral-400">No lots yet</Text>
            <TouchableOpacity
              onPress={() => setModalOpen(true)}
              className={`rounded-xl px-4 py-3 ${PRIMARY.bg}`}
              activeOpacity={0.9}>
              <Text className={`font-bold ${PRIMARY.textOn}`}>Create the first one</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            renderItem={({ item }) => <AuctionCard item={item} />}
            ItemSeparatorComponent={() => <View className="h-3" />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />
            }
          />
        )}

        {/* FAB */}
        {['superadmin', 'owner', 'admin'].includes(user?.position ?? '') && (
          <>
            <TouchableOpacity
              className={`absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full ${PRIMARY.bg} shadow`}
              onPress={() => setModalOpen(true)}
              activeOpacity={0.9}>
              <Text className={`text-[28px] font-black leading-[28px] ${PRIMARY.textOn}`}>＋</Text>
            </TouchableOpacity>

            <CreateAuctionModal
              visible={modalOpen}
              onClose={() => setModalOpen(false)}
              onCreated={(created) => setItems((prev) => [created, ...prev])}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuctionPage;
