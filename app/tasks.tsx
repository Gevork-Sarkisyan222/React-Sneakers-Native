import { DailyTasks, WeeklyTasks } from '@/constants/Types';
import { useGetUser } from '@/hooks/useGetUser';
import { setRemoveAllMarks } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Modal, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

type Props = {};

type TaskCardProps = {
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  progressText: string;
  reward: string;
  accent?: boolean;
  claimed_reward?: boolean;
};

const getProgressPercent = (text: string): number => {
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;

  const current = Number(match[1]);
  const total = Number(match[2]);
  if (!total || Number.isNaN(current) || Number.isNaN(total)) return 0;

  const value = (current / total) * 100;
  return Math.max(0, Math.min(100, value));
};

const TaskCard: React.FC<TaskCardProps> = ({
  type,
  title,
  description,
  progressText,
  reward,
  accent,
  claimed_reward,
}) => {
  const progress = getProgressPercent(progressText);
  const claimed = Boolean(claimed_reward);

  const containerBg = claimed
    ? 'bg-slate-100 border-slate-200'
    : accent
      ? 'bg-emerald-50 border-emerald-300'
      : 'bg-slate-50 border-slate-200';

  const iconBg = claimed ? 'bg-slate-200' : accent ? 'bg-emerald-100' : 'bg-slate-100';

  const titleColor = claimed ? 'text-slate-500' : 'text-slate-900';
  const descColor = claimed ? 'text-slate-400' : 'text-slate-500';

  const badgeCls = claimed
    ? 'bg-slate-200 text-slate-600'
    : type === 'daily'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-sky-50 text-sky-700';

  const progressTrack = claimed ? 'bg-slate-200' : 'bg-slate-200';
  const progressFill = claimed ? 'bg-slate-400' : 'bg-emerald-400';

  const rewardPill = claimed
    ? 'bg-slate-200 border border-slate-300'
    : 'bg-amber-50 border border-amber-300';
  const rewardText = claimed ? 'text-slate-600' : 'text-amber-700';

  return (
    <View className={`mb-3 rounded-2xl border p-4 flex-row items-center gap-3 ${containerBg}`}>
      <View className={`h-11 w-11 rounded-2xl items-center justify-center ${iconBg}`}>
        <Text className={`text-xl ${claimed ? 'opacity-60' : ''}`}>
          {type === 'daily' ? '🌅' : '📅'}
        </Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-base font-semibold ${titleColor}`} numberOfLines={1}>
            {title}
          </Text>

          <View className={`px-2 py-0.5 rounded-full ml-2 ${badgeCls}`}>
            <Text
              className={`text-[11px] ${type === 'daily' ? 'text-emerald-700' : 'text-sky-700'}`}>
              {claimed ? 'Claimed' : type === 'daily' ? 'Daily' : 'Weekly'}
            </Text>
          </View>
        </View>

        <Text className={`text-xs mb-2 ${descColor}`} numberOfLines={2}>
          {description}
        </Text>

        {/* Status “reward claimed” */}
        {/* {claimed && (
      <View className="mb-2 px-2 py-1 rounded-xl bg-white border border-slate-200">
        <Text className="text-[11px] text-slate-600">✅ Reward already claimed</Text>
      </View>
    )} */}

        {/* Progress */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className={`h-1.5 rounded-full overflow-hidden ${progressTrack}`}>
              <View
                className={`h-1.5 rounded-full ${progressFill}`}
                style={{ width: `${progress}%` }}
              />
            </View>

            <Text className={`text-[11px] mt-1 ${claimed ? 'text-slate-400' : 'text-slate-500'}`}>
              {claimed ? 'Progress locked • reward claimed' : progressText}
            </Text>
          </View>

          {/* Reward */}
          <View className="items-end">
            <Text className={`text-[11px] mb-0.5 ${claimed ? 'text-slate-400' : 'text-slate-500'}`}>
              Reward
            </Text>

            <View className={`px-2 py-1 rounded-full ${rewardPill}`}>
              <Text className={`text-[11px] font-semibold ${rewardText}`}>
                {claimed ? 'Claimed' : reward}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

function TasksPage({}: Props) {
  const { user } = useGetUser({});
  const router = useRouter();
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);
  const dispatch = useDispatch();

  const [dailyTasksRes, setDailyTasksRes] = React.useState<DailyTasks[]>([]);
  const [weeklyTasksRes, setWeeklyTasksRes] = React.useState<WeeklyTasks[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks');

      const dailyTasks = data.filter((task: any) => task.type === 'daily');
      const weeklyTasks = data.filter((task: any) => task.type === 'weekly');
      setDailyTasksRes(dailyTasks);
      setWeeklyTasksRes(weeklyTasks);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();

      return () => {};
    }, [fetchTasks]),
  );

  const dailyTasks = dailyTasksRes[0];
  const weeklyTasks = weeklyTasksRes[0];

  // code
  const enterApp = Number(dailyTasks?.enter_app ?? 0); // 0 or 1
  const enterAppCompleted = enterApp >= 1;

  const enterAppProgressText = enterAppCompleted
    ? '1 / 1 • Login completed'
    : '0 / 1 • Log in today';

  const weeklyEnter = Number(weeklyTasks?.enter_app_6_days ?? 0); // 0–6
  const weeklyDone = weeklyEnter >= 6;

  const weeklyProgressText = weeklyDone
    ? '6 / 6 days • Completed'
    : `${Math.min(weeklyEnter, 6)} / 6 days • Log in ${Math.max(0, 6 - weeklyEnter)} more day(s)`;

  // DAILY: Collect style (3 items)
  const collect3 = Number(dailyTasks?.collect_3_products ?? 0);
  const collect3Done = collect3 >= 3;

  const collect3ProgressText = collect3Done
    ? '3 / 3 items • Completed'
    : `${Math.min(collect3, 3)} / 3 items • ${Math.max(0, 3 - collect3)} left`;

  // WEEKLY: Style hunter (15 items)
  const collect15 = Number(weeklyTasks?.collect_15_products ?? 0);
  const collect15Done = collect15 >= 15;

  const collect15ProgressText = collect15Done
    ? '15 / 15 items • Completed'
    : `${Math.min(collect15, 15)} / 15 items • ${Math.max(0, 15 - collect15)} left`;

  // DAILY: 1 review
  const dailyReviews = Number(dailyTasks?.make_review ?? 0);
  const dailyReviewsDone = dailyReviews >= 1;

  const dailyReviewsText = dailyReviewsDone
    ? '1 / 1 review • Completed'
    : `${Math.min(dailyReviews, 1)} / 1 review • Leave a review`;

  // WEEKLY: 5 reviews
  const weeklyReviews = Number(weeklyTasks?.make_5_review ?? 0);
  const weeklyReviewsDone = weeklyReviews >= 5;

  const weeklyReviewsText = weeklyReviewsDone
    ? '5 / 5 reviews • Completed'
    : `${Math.min(weeklyReviews, 5)} / 5 reviews • ${Math.max(0, 5 - weeklyReviews)} left`;

  // DAILY: Case sprint (1 case)
  const dailyCases = Number(dailyTasks?.buyed_opened_cases ?? 0);
  const dailyCasesDone = dailyCases >= 1;

  const dailyCasesText = dailyCasesDone
    ? '1 / 1 case • Completed'
    : `${Math.min(dailyCases, 1)} / 1 case • Open a case`;

  // WEEKLY: Weekly case hunter (20 cases)
  const weeklyCases = Number(weeklyTasks?.buyed_opened_20_cases ?? 0);
  const weeklyCasesDone = weeklyCases >= 20;

  const weeklyCasesText = weeklyCasesDone
    ? '20 / 20 cases • Completed'
    : `${Math.min(weeklyCases, 20)} / 20 cases`;

  // DAILY: 3 purchases per day
  const dailyBuys = Number(dailyTasks?.buy_3_product ?? 0);
  const dailyBuysDone = dailyBuys >= 3;

  const dailyBuysText = dailyBuysDone
    ? '3 / 3 purchases • Completed'
    : `${Math.min(dailyBuys, 3)} / 3 purchases • ${Math.max(0, 3 - dailyBuys)} left`;

  // WEEKLY: 6 purchases per week
  const weeklyBuys = Number(weeklyTasks?.buy_6_product ?? 0);
  const weeklyBuysDone = weeklyBuys >= 6;

  const weeklyBuysText = weeklyBuysDone
    ? '6 / 6 purchases • Completed'
    : `${Math.min(weeklyBuys, 6)} / 6 purchases • ${Math.max(0, 6 - weeklyBuys)} left`;

  // WEEKLY: 3 rare drops from cases
  const rareWins = Number(weeklyTasks?.win_3_rare_in_cases ?? 0);
  const rareWinsDone = rareWins >= 3;

  const rareWinsText = rareWinsDone
    ? '3 / 3 items • Completed'
    : `${Math.min(rareWins, 3)} / 3 items`;

  // new logic

  const dailyTasksCompleted: boolean =
    enterAppCompleted && collect3Done && dailyReviewsDone && dailyCasesDone && dailyBuysDone;

  const weeklyTasksCompleted: boolean =
    weeklyDone &&
    collect15Done &&
    weeklyReviewsDone &&
    weeklyCasesDone &&
    weeklyBuysDone &&
    rareWinsDone;

  const dailyDoneCount =
    Number(enterAppCompleted) +
    Number(collect3Done) +
    Number(dailyReviewsDone) +
    Number(dailyCasesDone) +
    Number(dailyBuysDone);

  const weeklyDoneCount =
    Number(weeklyDone) +
    Number(collect15Done) +
    Number(weeklyReviewsDone) +
    Number(weeklyCasesDone) +
    Number(weeklyBuysDone) +
    Number(rareWinsDone);

  // ---- стейт модалок ----
  const [dailyRewardModalVisible, setDailyRewardModalVisible] = React.useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = React.useState(false);

  const [weeklyRewardModalVisible, setWeeklyRewardModalVisible] = React.useState(false);
  const [weeklyRewardClaimed, setWeeklyRewardClaimed] = React.useState(false);

  const rewardScale = React.useRef(new Animated.Value(0.8)).current;
  const rewardOpacity = React.useRef(new Animated.Value(0)).current;

  const weeklyRewardScale = React.useRef(new Animated.Value(0.8)).current;
  const weeklyRewardOpacity = React.useRef(new Animated.Value(0)).current;

  // daily pop-up
  const openDailyRewardModal = () => {
    setDailyRewardModalVisible(true);
    rewardScale.setValue(0.6);
    rewardOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(rewardOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rewardScale, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(rewardScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const closeDailyRewardModal = () => {
    Animated.timing(rewardOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setDailyRewardModalVisible(false);
    });
  };

  // weekly pop-up
  const openWeeklyRewardModal = () => {
    setWeeklyRewardModalVisible(true);
    weeklyRewardScale.setValue(0.6);
    weeklyRewardOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(weeklyRewardOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(weeklyRewardScale, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(weeklyRewardScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const closeWeeklyRewardModal = () => {
    Animated.timing(weeklyRewardOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setWeeklyRewardModalVisible(false);
    });
  };

  const shouldShowDailyRewardCard = dailyTasksCompleted && !dailyRewardClaimed;
  const shouldShowWeeklyRewardCard = weeklyTasksCompleted && !weeklyRewardClaimed;

  // accept gitfts
  const handleClaimDailyCase = async () => {
    // guard: no user or reward cannot be claimed
    if (!user || !shouldShowDailyRewardCard) return;

    try {
      const bonus = 712;
      const newBalance = (user.balance ?? 0) + bonus;

      // 1) Credit the user's balance
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user.id}`, {
        balance: newBalance,
      });

      // 2) Mark the daily quest as "reward claimed"
      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
        claimed: true,
      });

      fetchTasks();

      Toast.show({
        type: 'success',
        text1: 'Reward claimed 🎉',
        text2: `Added ${bonus} ₽ to your balance`,
        visibilityTime: 3000,
      });

      setDailyRewardClaimed(true);
      closeDailyRewardModal();
    } catch (err) {
      console.error('Error while crediting daily reward:', err);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to grant the reward. Try again later.',
        visibilityTime: 3000,
      });
    }
  };

  const handleClaimWeeklyCase = async () => {
    if (!user || !shouldShowWeeklyRewardCard) {
      return;
    }

    try {
      const bonusMoney = 2150;
      const newBalance = (user.balance ?? 0) + bonusMoney;

      const items = [
        {
          title: 'Reward: Modern hoodie',
          imageUri:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8O4oEDmEzscfhZA2U-5X1Ped7c_16w8p0gg&s',
          price: '0',
        },
        {
          title: 'Reward: Gilse Balance sneakers',
          imageUri:
            'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/311306/01/fnd/PNA/fmt/png/MB.04-Golden-Child-Men%27s-Basketball-Shoes',
          price: '0',
        },
        {
          title: 'Reward: Premium watch',
          imageUri:
            'https://imagedelivery.net/lyg2LuGO05OELPt1DKJTnw/1cc939bb-98af-4be1-eeb9-10147b738d00/w=400x400',
          price: '0',
        },
        {
          title: 'Gift: Premium case',
          imageUri: 'https://i.ibb.co/4gdxk2KT/case.webp',
          price: '0',
        },
      ];

      // 1) Начисляем бабки пользователю
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${user.id}`, {
        balance: newBalance,
      });

      // 2) добавляем подарки в корзину ПОСЛЕДОВАТЕЛЬНО (без 429)
      for (const item of items) {
        try {
          await axios.post('https://dcc2e55f63f7f47b.mokky.dev/cart', {
            ...item,
          });
        } catch (e) {
          console.error('Не добавился item в cart:', item.title, e);
        }
      }

      dispatch(setRemoveAllMarks(!removeAllMarks));

      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
        claimed: true,
      });

      fetchTasks();

      Toast.show({
        type: 'success',
        text1: 'Reward claimed 🎉',
        text2: `Added ${bonusMoney}₽ to your balance and all gifts are in your cart!`,
        visibilityTime: 3000,
      });

      setWeeklyRewardClaimed(true);
      closeWeeklyRewardModal();
    } catch (err) {
      console.error(err);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to grant the reward. Try again later.',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Верхний блок */}
          <View className="px-5 pt-2 pb-3 bg-white">
            {/* Header + streak */}
            <View className="flex-row items-center justify-between">
              <View className="flex gap-[8px] items-start flex-row">
                <TouchableOpacity
                  className="h-9 w-9 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm"
                  activeOpacity={0.7}
                  onPress={() => {
                    router.back();
                  }}>
                  <Text className="text-xl text-slate-700">‹</Text>
                </TouchableOpacity>
                <View>
                  <Text className="text-xl font-semibold text-slate-900">Your quests 👟</Text>
                  <Text className="text-xs text-slate-500 mt-1 max-w-[90%]">
                    Complete tasks to earn coins and cases
                  </Text>
                </View>
              </View>

              {/* Mini progress card */}
              <View className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 items-end">
                <Text className="text-[11px] text-emerald-700">Streak</Text>
                <Text className="text-lg font-semibold text-slate-900">
                  7<Text className="text-xs text-slate-500"> days</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Список заданий */}
          <ScrollView
            className="flex-1 mt-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}>
            {/* Daily */}
            <View className="mt-3 mb-1 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-slate-900">Daily tasks</Text>
                <View className="px-2 py-0.5 rounded-full bg-emerald-50">
                  <Text className="text-[11px] text-emerald-700">{dailyDoneCount}/5</Text>
                </View>
              </View>
            </View>

            <TaskCard
              type="daily"
              title="Daily warm-up"
              description="Open the app and check out the sneakers feed."
              progressText={enterAppProgressText}
              reward="+20 ₽"
              accent={enterAppCompleted}
              claimed_reward={Boolean(dailyTasks?.claimed)}
            />

            <TaskCard
              type="daily"
              title="Build your style"
              description="Add 3 pairs to favorites to save your set."
              progressText={collect3ProgressText}
              reward="+22 ₽"
              accent={collect3Done}
              claimed_reward={Boolean(dailyTasks?.claimed)}
            />

            <TaskCard
              type="daily"
              title="Leave a review"
              description="Leave a review on a sneaker to get a bonus."
              progressText={dailyReviewsText}
              reward="+70 ₽"
              accent={dailyReviewsDone}
              claimed_reward={Boolean(dailyTasks?.claimed)}
            />

            <TaskCard
              type="daily"
              title="Case sprint"
              description="Buy and open 1 case to get a bonus."
              progressText={dailyCasesText}
              reward="+280 ₽"
              accent={dailyCasesDone}
              claimed_reward={Boolean(dailyTasks?.claimed)}
            />

            <TaskCard
              type="daily"
              title="Make 3 purchases"
              description="Make 3 purchases today to claim the bonus."
              progressText={dailyBuysText}
              reward="+320 ₽"
              accent={dailyBuysDone}
              claimed_reward={Boolean(dailyTasks?.claimed)}
            />

            {!dailyTasks?.claimed && dailyTasksCompleted && (
              <>
                <View className="mt-4 mb-3 rounded-3xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex-row items-center justify-between">
                  {/* Text part */}
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-base font-semibold text-emerald-800">Daily reward</Text>
                      <Text className="ml-2 text-lg">🎁</Text>
                    </View>
                    <Text className="text-[11px] text-slate-600">
                      You’ve completed all daily tasks. Claim your bonus!
                    </Text>
                  </View>

                  {/* "Claim" button */}
                  <TouchableOpacity
                    className="px-3 py-2 rounded-2xl bg-emerald-500 items-center justify-center"
                    activeOpacity={0.85}
                    onPress={openDailyRewardModal}>
                    <Text className="text-xs font-semibold text-white">Claim</Text>
                  </TouchableOpacity>
                </View>

                {/* Full-width divider — end of daily block */}
                <View className="h-[1px] bg-slate-200 -mx-5 mb-4" />
              </>
            )}

            {/* Weekly */}
            <View className="mt-5 mb-1 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-slate-900">Weekly tasks</Text>
                <View className="px-2 py-0.5 rounded-full bg-sky-50">
                  <Text className="text-[11px] text-sky-700">{weeklyDoneCount}/6</Text>
                </View>
              </View>
            </View>

            <TaskCard
              type="weekly"
              title="Seven-day marathon"
              description="Log into the app 6 days in a row this week."
              progressText={weeklyProgressText}
              reward="+300 ₽"
              accent={weeklyDone}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            <TaskCard
              type="weekly"
              title="Big shopping week"
              description="Make 6 purchases this week to claim a special bonus."
              progressText={weeklyBuysText}
              reward="+450 ₽ + gift"
              accent={weeklyBuysDone}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            <TaskCard
              type="weekly"
              title="Weekly case hunter"
              description="Open & buy 20 cases this week and get a premium reward."
              progressText={weeklyCasesText}
              reward="+600 ₽ + premium gift"
              accent={weeklyCasesDone}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            <TaskCard
              type="weekly"
              title="Style hunter"
              description="Add 15 sneakers to favorites this week."
              progressText={collect15ProgressText}
              reward="+400 ₽"
              accent={collect15Done}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            <TaskCard
              type="weekly"
              title="Social week"
              description="Leave 5 reviews this week to get a bonus."
              progressText={weeklyReviewsText}
              reward="+400 ₽"
              accent={weeklyReviewsDone}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            <TaskCard
              type="weekly"
              title="Weekly case dropper"
              description="Win 3 rare items from cases this week."
              progressText={rareWinsText}
              reward="Rare case + gift"
              accent={rareWinsDone}
              claimed_reward={Boolean(weeklyTasks?.claimed)}
            />

            {!weeklyTasks?.claimed && weeklyTasksCompleted && (
              <View className="mt-4 mb-6 rounded-3xl bg-amber-50 border border-amber-300 px-4 py-3 flex-row items-center justify-between shadow-sm">
                {/* Text part */}
                <View className="flex-1 mr-3">
                  <Text className="text-[10px] font-semibold text-amber-700 uppercase tracking-[1px]">
                    Premium reward
                  </Text>

                  <View className="flex-row items-center mb-1 mt-1">
                    <Text className="text-base font-semibold text-slate-900">Weekly reward</Text>
                    <Text className="ml-2 text-lg">👑</Text>
                  </View>

                  <Text className="text-[11px] text-slate-600">
                    You’ve completed all weekly quests. Claim your premium reward.
                  </Text>
                </View>

                {/* "Claim" button */}
                <TouchableOpacity
                  className="px-3 py-2 rounded-2xl bg-amber-500 items-center justify-center"
                  activeOpacity={0.9}
                  onPress={openWeeklyRewardModal}>
                  <Text className="text-xs font-semibold text-white">Claim</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>

      {/* modals */}
      <Modal
        transparent
        visible={dailyRewardModalVisible}
        animationType="none"
        onRequestClose={closeDailyRewardModal}>
        <View className="flex-1 bg-black/40 items-center justify-center">
          <Animated.View
            className="w-[86%] rounded-3xl bg-white border border-emerald-200 px-5 py-6 items-center shadow-2xl"
            style={{
              opacity: rewardOpacity,
              transform: [{ scale: rewardScale }],
            }}>
            {/* top badge */}
            <View className="mb-3 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <Text className="text-[10px] font-semibold text-emerald-600 tracking-[1px] uppercase">
                Daily reward
              </Text>
            </View>

            {/* emoji / confetti */}
            <Text className="text-4xl mb-2">🎉</Text>

            <Text className="text-lg font-bold text-slate-900 mb-1 text-center">
              Tap to claim your daily reward
            </Text>

            <Text className="text-[12px] text-slate-500 mb-4 text-center">
              You completed all daily quests and earned a bonus.
            </Text>

            {/* Reward amount */}
            <View className="mb-4 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-300">
              <Text className="text-xs text-emerald-700 text-center mb-1">Your bonus</Text>
              <Text className="text-3xl font-extrabold text-emerald-600 text-center">712 ₽</Text>
            </View>

            {/* "Claim" button inside the modal */}
            <TouchableOpacity
              className="mt-1 px-4 py-2 rounded-2xl bg-emerald-500 items-center justify-center w-full"
              activeOpacity={0.9}
              onPress={handleClaimDailyCase}>
              <Text className="text-sm font-semibold text-white">Claim 712 ₽</Text>
            </TouchableOpacity>

            {/* Small "Close" button */}
            <TouchableOpacity className="mt-3" activeOpacity={0.7} onPress={closeDailyRewardModal}>
              <Text className="text-[11px] text-slate-400">Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* next weekly modal */}
      <Modal
        transparent
        visible={weeklyRewardModalVisible}
        animationType="none"
        onRequestClose={closeWeeklyRewardModal}>
        <View className="flex-1 bg-black/40 items-center justify-center">
          <Animated.View
            className="w-[86%] rounded-3xl bg-white border border-amber-300 px-5 py-6 items-center shadow-2xl"
            style={{
              opacity: weeklyRewardOpacity,
              transform: [{ scale: weeklyRewardScale }],
            }}>
            <View className="mb-3 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              <Text className="text-[10px] font-semibold text-amber-700 tracking-[1px] uppercase">
                Premium reward
              </Text>
            </View>

            <Text className="text-4xl mb-2">👑</Text>

            <Text className="text-lg font-bold text-slate-900 mb-1 text-center">
              Tap to claim your premium quest reward
            </Text>

            <Text className="text-[12px] text-slate-500 mb-4 text-center">
              You completed all weekly quests and earned a premium reward.
            </Text>

            <View className="mb-4 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 w-full relative">
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/1149/1149425.png',
                }}
                className="w-8 h-8 mb-1 absolute left-[40px] top-[10px] -scale-x-100"
                resizeMode="contain"
              />
              <Text className="text-xs text-amber-700 text-center mb-1">Your bonus</Text>
              <Text className="text-2xl font-extrabold text-amber-600 text-center">2150 ₽</Text>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/1149/1149425.png',
                }}
                className="w-8 h-8 mb-1 absolute right-[40px] top-[10px]"
                resizeMode="contain"
              />
            </View>

            {/* Three reward cards in a row */}
            <View className="mb-3 flex-row gap-2">
              {/* Card 1 — hoodie */}
              <View className="flex-1 rounded-2xl bg-amber-50 border border-amber-200 p-2 items-center">
                <Image
                  className="w-full h-14 mb-1"
                  source={{
                    uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8O4oEDmEzscfhZA2U-5X1Ped7c_16w8p0gg&s',
                  }}
                  resizeMode="cover"
                />
                <Text className="text-[11px] font-semibold text-amber-700 text-center">
                  Modern hoodie
                </Text>
              </View>

              {/* Card 2 — sneakers */}
              <View className="flex-1 rounded-2xl bg-amber-50 border border-amber-200 p-2 items-center">
                <Image
                  className="w-full h-14 mb-1"
                  source={require('../assets/images/shoe.png')}
                  resizeMode="cover"
                />
                <Text className="text-[11px] font-semibold text-amber-700 text-center">
                  Gilse Balance sneakers
                </Text>
              </View>

              {/* Card 3 — watch */}
              <View className="flex-1 rounded-2xl bg-amber-50 border border-amber-200 p-2 items-center">
                <Image
                  className="w-full h-14 mb-1"
                  source={{
                    uri: 'https://imagedelivery.net/lyg2LuGO05OELPt1DKJTnw/1cc939bb-98af-4be1-eeb9-10147b738d00/w=400x400',
                  }}
                  resizeMode="cover"
                />
                <Text className="text-[11px] font-semibold text-amber-700 text-center">
                  Premium watch
                </Text>
              </View>
            </View>

            {/* Premium case full width at the bottom */}
            <View className="w-full rounded-3xl bg-amber-50 border border-amber-300 px-3 py-3">
              {/* top: text + gifts */}
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-[10px] font-semibold text-amber-700 uppercase tracking-[1px]">
                    Premium case
                  </Text>
                  <Text className="text-xs text-amber-800 mt-0.5">Main prize of the week</Text>
                </View>

                <Text className="text-2xl">🎁🎁🎁</Text>
              </View>

              {/* center the case */}
              <View className="mt-1 w-full items-center">
                <View className="w-[100%] h-[150px] self-center">
                  <Image
                    className="w-full h-full"
                    source={require('../assets/images/case.webp')}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="mt-[14px] px-4 py-2 rounded-2xl bg-amber-500 items-center justify-center w-full"
              activeOpacity={0.9}
              onPress={handleClaimWeeklyCase}>
              <Text className="text-sm font-semibold text-white">Claim reward</Text>
            </TouchableOpacity>

            <TouchableOpacity className="mt-3" activeOpacity={0.7} onPress={closeWeeklyRewardModal}>
              <Text className="text-[11px] text-slate-400">Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

export default TasksPage;
