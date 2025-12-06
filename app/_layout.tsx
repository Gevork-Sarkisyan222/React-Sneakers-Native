import React from 'react';
import { Stack } from 'expo-router';
import '@/app/global.css';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/redux/store';
import { Provider } from 'react-redux';
import { SalesInfoProvider } from '@/components/context/SalesInfoContext';
import Toast from 'react-native-toast-message';
import { View } from 'react-native';
import { BlockedGuard } from '@/components/BlockedGuard';
import { useSettleEndedAuctions } from '@/hooks/useSettleEndedAuctions';
import axios from 'axios';
import { useGetUser } from '@/hooks/useGetUser';

export default function RootLayout() {
  useSettleEndedAuctions();
  const { user } = useGetUser({});

  const fetchDatas = async () => {
    try {
      const now = new Date();
      const todayDate = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

      const [dailyRes, weeklyRes] = await Promise.all([
        axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/1'), // daily
        axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2'), // weekly
      ]);

      const daily = dailyRes.data;
      const weekly = weeklyRes.data;

      const dailyEndTime = daily?.end_time ? new Date(daily.end_time) : null;
      const weeklyEndTime = weekly?.end_time ? new Date(weekly.end_time) : null;

      // daily: флаг первого входа в день
      const enterApp = typeof daily?.enter_app === 'number' ? daily.enter_app : 0;

      // weekly: счётчик входов по дням и последняя дата входа
      const enterApp6Days =
        typeof weekly?.enter_app_6_days === 'number' ? weekly.enter_app_6_days : 0;
      const lastEnterDate =
        typeof weekly?.last_enter_date === 'string' ? weekly.last_enter_date : null;

      // Нужно ли пересоздавать daily
      const shouldResetDaily =
        !dailyEndTime || Number.isNaN(dailyEndTime.getTime()) || dailyEndTime <= now;

      // Нужно ли пересоздавать weekly
      const shouldResetWeekly =
        !weeklyEndTime || Number.isNaN(weeklyEndTime.getTime()) || weeklyEndTime <= now;

      const requests: Promise<any>[] = [];

      // === DAILY (id: 1) ===
      if (shouldResetDaily) {
        // 🔁 Новый ежедневный цикл — полностью сбрасываем прогресс
        const dailyStart = now.toISOString();
        const dailyEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
        const dailyEnd = dailyEndDate.toISOString();

        requests.push(
          axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
            start_time: dailyStart,
            end_time: dailyEnd,
            // ВХОД: сразу считаем, что пользователь уже зашёл (раз он открыл приложение)
            enter_app: 1,

            // 👇 СБРОС ВСЕГО ПРОГРЕССА DAILY (подгони названия под свои поля)
            collect_3_products: 0, // "Собери стиль"
            make_review: 0, // "Оставь отзыв"
            buyed_opened_cases: 0, // "Кейсовый спринт"
            buy_3_product: 0, // "Сделай 3 покупки"
          }),
        );
      } else {
        // период ещё активен, но enter_app = 0 → это первый вход в текущем дневном цикле
        if (enterApp === 0) {
          requests.push(
            axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
              enter_app: 1,
            }),
          );
        }
      }

      // === WEEKLY (id: 2) ===
      if (shouldResetWeekly) {
        // 🔁 Новый недельный цикл — полностью сбрасываем прогресс
        const weeklyStart = now.toISOString();

        // конец недели: ближайшее воскресенье 23:59:59
        const weekEnd = new Date(now);
        const day = weekEnd.getDay(); // 0 — воскресенье, 1 — понедельник, ...
        const daysToEnd = day === 0 ? 0 : 7 - day;

        weekEnd.setDate(weekEnd.getDate() + daysToEnd);
        weekEnd.setHours(23, 59, 59, 999);

        const weeklyEnd = weekEnd.toISOString();

        requests.push(
          axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
            start_time: weeklyStart,
            end_time: weeklyEnd,

            // первый день входа в новом недельном цикле
            enter_app_6_days: 1,
            last_enter_date: todayDate,

            // 👇 СБРОС ВСЕГО ПРОГРЕССА WEEKLY (подгони под свои поля)
            buy_6_product: 0,
            buyed_opened_20_cases: 0,
            collect_15_products: 0,
            make_5_review: 0,
            win_3_rare_in_cases: 0,
          }),
        );
      } else {
        // неделя ещё идёт, проверяем "новый день"
        if (lastEnterDate !== todayDate) {
          const newCount = enterApp6Days + 1;

          requests.push(
            axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
              enter_app_6_days: newCount,
              last_enter_date: todayDate,
            }),
          );
        }
      }

      if (requests.length > 0) {
        await Promise.all(requests);
        console.log('Таймеры квестов и прогресс обновлены (reset + счётчики)');
      } else {
        console.log('Все таймеры ещё актуальны, ничего не обновляем');
      }
    } catch (error) {
      console.error('Ошибка обновления времени квестов:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchDatas();
    }
  }, []);

  return (
    <SalesInfoProvider>
      <BlockedGuard>
        <Provider store={store}>
          <GluestackUIProvider mode="light">
            <SafeAreaProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="not-found" />
              </Stack>

              <StatusBar style="auto" />
            </SafeAreaProvider>
          </GluestackUIProvider>
        </Provider>

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999999,
            elevation: 999999,
          }}>
          <Toast />
        </View>
      </BlockedGuard>
    </SalesInfoProvider>
  );
}
