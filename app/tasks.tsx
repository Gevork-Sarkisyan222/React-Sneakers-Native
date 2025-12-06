import { DailyTasks, WeeklyTasks } from '@/constants/Types';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type Props = {};

type TaskCardProps = {
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  progressText: string;
  reward: string;
  accent?: boolean;
};

const getProgressPercent = (text: string): number => {
  // Ищем что-то вида "1 / 3", "2/5", "10 / 10"
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;

  const current = Number(match[1]);
  const total = Number(match[2]);
  if (!total || Number.isNaN(current) || Number.isNaN(total)) return 0;

  const value = (current / total) * 100;
  // Ограничим от 0 до 100 на всякий случай
  return Math.max(0, Math.min(100, value));
};

const TaskCard: React.FC<TaskCardProps> = ({
  type,
  title,
  description,
  progressText,
  reward,
  accent,
}) => {
  const progress = getProgressPercent(progressText);

  return (
    <View
      className={`
        mb-3 rounded-2xl border p-4 flex-row items-center gap-3
        ${accent ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}
      `}>
      {/* Иконка слева */}
      <View
        className={`
          h-11 w-11 rounded-2xl items-center justify-center
          ${accent ? 'bg-emerald-100' : 'bg-slate-100'}
        `}>
        <Text className="text-xl">{type === 'daily' ? '🌅' : '📅'}</Text>
      </View>

      {/* Текст */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
            {title}
          </Text>
          <Text
            className={`
              text-[11px] px-2 py-0.5 rounded-full ml-2
              ${type === 'daily' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}
            `}>
            {type === 'daily' ? 'Daily' : 'Weekly'}
          </Text>
        </View>

        <Text className="text-xs text-slate-500 mb-2" numberOfLines={2}>
          {description}
        </Text>

        {/* Прогресс */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <View
                className="h-1.5 rounded-full bg-emerald-400"
                style={{ width: `${progress}%` }} // тут уже 100% при 1 / 1
              />
            </View>
            <Text className="text-[11px] text-slate-500 mt-1">{progressText}</Text>
          </View>

          {/* Награда */}
          <View className="items-end">
            <Text className="text-[11px] text-slate-500 mb-0.5">Награда</Text>
            <View className="px-2 py-1 rounded-full bg-amber-50 border border-amber-300">
              <Text className="text-[11px] font-semibold text-amber-700">{reward}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

function TasksPage({}: Props) {
  const router = useRouter();

  const [dailyTasksRes, setDailyTasksRes] = React.useState<DailyTasks[]>([]);
  const [weeklyTasksRes, setWeeklyTasksRes] = React.useState<WeeklyTasks[]>([]);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks');

      const dailyTasks = data.filter((task: any) => task.type === 'daily');
      const weeklyTasks = data.filter((task: any) => task.type === 'weekly');
      setDailyTasksRes(dailyTasks);
      setWeeklyTasksRes(weeklyTasks);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  });

  const dailyTasks = dailyTasksRes[0];
  const weeklyTasks = weeklyTasksRes[0];

  // code
  const enterApp = Number(dailyTasks?.enter_app ?? 0); // 0 или 1
  const enterAppCompleted = enterApp >= 1;

  const enterAppProgressText = enterAppCompleted
    ? '1 / 1 • Вход выполнен'
    : '0 / 1 • Войти сегодня';

  const weeklyEnter = Number(weeklyTasks?.enter_app_6_days ?? 0); // 0–6
  const weeklyDone = weeklyEnter >= 6;

  const weeklyProgressText = weeklyDone
    ? '6 / 6 дней • Выполнено'
    : `${Math.min(weeklyEnter, 6)} / 6 дней • Зайди ещё ${Math.max(0, 6 - weeklyEnter)} дн.`;

  // DAILY: Собери стиль (3 товара)
  const collect3 = Number(dailyTasks?.collect_3_products ?? 0);
  const collect3Done = collect3 >= 3;

  const collect3ProgressText = collect3Done
    ? '3 / 3 товара • Выполнено'
    : `${Math.min(collect3, 3)} / 3 товара • Осталось ${Math.max(0, 3 - collect3)}`;

  // WEEKLY: Охотник за стилем (15 товаров)
  const collect15 = Number(weeklyTasks?.collect_15_products ?? 0);
  const collect15Done = collect15 >= 15;

  const collect15ProgressText = collect15Done
    ? '15 / 15 товаров • Выполнено'
    : `${Math.min(collect15, 15)} / 15 товаров • Осталось ${Math.max(0, 15 - collect15)}`;

  // DAILY: 1 отзыв
  const dailyReviews = Number(dailyTasks?.make_review ?? 0);
  const dailyReviewsDone = dailyReviews >= 1;

  const dailyReviewsText = dailyReviewsDone
    ? '1 / 1 отзыв • Выполнено'
    : `${Math.min(dailyReviews, 1)} / 1 отзыв • Оставь отзыв`;

  // WEEKLY: 5 отзывов
  const weeklyReviews = Number(weeklyTasks?.make_5_review ?? 0);
  const weeklyReviewsDone = weeklyReviews >= 5;

  const weeklyReviewsText = weeklyReviewsDone
    ? '5 / 5 отзывов • Выполнено'
    : `${Math.min(weeklyReviews, 5)} / 5 отзывов • Осталось ${Math.max(0, 5 - weeklyReviews)}`;

  // DAILY: Кейсовый спринт (1 кейс)
  const dailyCases = Number(dailyTasks?.buyed_opened_cases ?? 0);
  const dailyCasesDone = dailyCases >= 1;

  const dailyCasesText = dailyCasesDone
    ? '1 / 1 кейс • Выполнено'
    : `${Math.min(dailyCases, 1)} / 1 кейс • Открой кейс`;

  // WEEKLY: Кейс-хантер недели (20 кейсов)
  const weeklyCases = Number(weeklyTasks?.buyed_opened_20_cases ?? 0);
  const weeklyCasesDone = weeklyCases >= 20;

  const weeklyCasesText = weeklyCasesDone
    ? '20 / 20 кейсов • Выполнено'
    : `${Math.min(weeklyCases, 20)} / 20 кейсов`;

  // DAILY: 3 покупки за день
  const dailyBuys = Number(dailyTasks?.buy_3_product ?? 0);
  const dailyBuysDone = dailyBuys >= 3;

  const dailyBuysText = dailyBuysDone
    ? '3 / 3 покупок • Выполнено'
    : `${Math.min(dailyBuys, 3)} / 3 покупок • Осталось ${Math.max(0, 3 - dailyBuys)}`;

  // WEEKLY: 6 покупок за неделю
  const weeklyBuys = Number(weeklyTasks?.buy_6_product ?? 0);
  const weeklyBuysDone = weeklyBuys >= 6;

  const weeklyBuysText = weeklyBuysDone
    ? '6 / 6 покупок • Выполнено'
    : `${Math.min(weeklyBuys, 6)} / 6 покупок • Осталось ${Math.max(0, 6 - weeklyBuys)}`;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Верхний блок */}
        <View className="px-5 pt-2 pb-3 bg-white">
          {/* Заголовок + стрик */}
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
                <Text className="text-xl font-semibold text-slate-900">Твои квесты 👟</Text>
                <Text className="text-xs text-slate-500 mt-1 max-w-[90%]">
                  Выполняй задачи, чтобы получать монеты и кейсы
                </Text>
              </View>
            </View>

            {/* Мини-карта прогресса */}
            <View className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 items-end">
              <Text className="text-[11px] text-emerald-700">Стрик</Text>
              <Text className="text-lg font-semibold text-slate-900">
                7<Text className="text-xs text-slate-500"> дней</Text>
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
              <Text className="text-sm font-semibold text-slate-900">Ежедневные задания</Text>
              <View className="px-2 py-0.5 rounded-full bg-emerald-50">
                <Text className="text-[11px] text-emerald-700">1/5</Text>
              </View>
            </View>
          </View>

          <TaskCard
            type="daily"
            title="Разогрев дня"
            description="Зайди в приложение и загляни в ленту кроссовок."
            progressText={enterAppProgressText}
            reward="+20 ₽"
            accent={enterAppCompleted}
          />

          <TaskCard
            type="daily"
            title="Собери стиль"
            description="Добавь 3 пары в избранное, чтобы сохранить свой сет."
            progressText={collect3ProgressText}
            reward="+22 ₽"
            accent={collect3Done}
          />

          <TaskCard
            type="daily"
            title="Оставь отзыв"
            description="Оставь отзыв в кроссовке, чтобы получить бонус."
            progressText={dailyReviewsText}
            reward="+70 ₽"
            accent={dailyReviewsDone}
          />

          <TaskCard
            type="daily"
            title="Кейсовый спринт"
            description="Купи и открой 1 кейс, чтобы получить бонус."
            progressText={dailyCasesText}
            reward="+280 ₽"
            accent={dailyCasesDone}
          />

          <TaskCard
            type="daily"
            title="Сделай 3 покупок"
            description="Соверши 3 покупок за этот день, чтобы забрать бонус."
            progressText={dailyBuysText}
            reward="+320 ₽"
            accent={dailyBuysDone}
          />

          {/* Weekly */}
          <View className="mt-5 mb-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-semibold text-slate-900">Еженедельные задания</Text>
              <View className="px-2 py-0.5 rounded-full bg-sky-50">
                <Text className="text-[11px] text-sky-700">0/6</Text>
              </View>
            </View>
          </View>

          <TaskCard
            type="weekly"
            title="Семидневный марафон"
            description="Заходи в приложение 6 дней подряд на этой неделе."
            progressText={weeklyProgressText}
            reward="+300 ₽"
            accent={weeklyDone}
          />

          <TaskCard
            type="weekly"
            title="Большая неделя покупок"
            description="Соверши 6 покупок за неделю, чтобы забрать особый бонус."
            progressText={weeklyBuysText}
            reward="+450 ₽ + подарок"
            accent={weeklyBuysDone}
          />

          <TaskCard
            type="weekly"
            title="Кейс-хантер недели"
            description="Открой & купи 20 кейсов за неделю и получи премиум-награду."
            progressText={weeklyCasesText}
            reward="+560 ₽ + премиум-подарок"
            accent={weeklyCasesDone}
          />

          <TaskCard
            type="weekly"
            title="Охотник за стилем"
            description="Добавь 15 кроссовок в избранное за эту неделю."
            progressText={collect15ProgressText}
            reward="+400 ₽"
            accent={collect15Done}
          />

          <TaskCard
            type="weekly"
            title="Социальная неделя"
            description="Оставь 5 отзывов за неделю, чтобы получить бонус."
            progressText={weeklyReviewsText}
            reward="+600 ₽"
            accent={weeklyReviewsDone}
          />

          <TaskCard
            type="weekly"
            title="Кейс-дропер недели"
            description="Выиграй 3 редких предмета из кейсов за неделю."
            progressText="0 / 3 предметов"
            reward="Редкий кейс + подарок"
          />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default TasksPage;
