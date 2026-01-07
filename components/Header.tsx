import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, View, Animated } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ui
import { Drawer, DrawerBackdrop } from '@/components/ui/drawer';
import CartDrawerContent from './cart/CartDrawerContent';
import { useFocusEffect, useRouter } from 'expo-router';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useGetUser } from '@/hooks/useGetUser';
import { DailyTasks, WeeklyTasks } from '@/constants/Types'; // если есть

export default function Header() {
  const { user } = useGetUser({});
  const [cartProducts, setCartProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(cartProducts.length);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const router = useRouter();
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);
  const [tasks, setTasks] = useState([]);

  const [dailyTask, setDailyTask] = useState<DailyTasks | null>(null);
  const [weeklyTask, setWeeklyTask] = useState<WeeklyTasks | null>(null);

  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);

  const isDailyCompleted = (d: any) => {
    const enterAppCompleted = Number(d?.enter_app ?? 0) >= 1;
    const collect3Done = Number(d?.collect_3_products ?? 0) >= 3;
    const reviewsDone = Number(d?.make_review ?? 0) >= 1;
    const casesDone = Number(d?.buyed_opened_cases ?? 0) >= 1;
    const buysDone = Number(d?.buy_3_product ?? 0) >= 3;

    return enterAppCompleted && collect3Done && reviewsDone && casesDone && buysDone;
  };

  const isWeeklyCompleted = (w: any) => {
    const weeklyEnterDone = Number(w?.enter_app_6_days ?? 0) >= 6;
    const collect15Done = Number(w?.collect_15_products ?? 0) >= 15;
    const reviews5Done = Number(w?.make_5_review ?? 0) >= 5;
    const cases20Done = Number(w?.buyed_opened_20_cases ?? 0) >= 20;
    const buys6Done = Number(w?.buy_6_product ?? 0) >= 6;
    const rareWinsDone = Number(w?.win_3_rare_in_cases ?? 0) >= 3;

    return (
      weeklyEnterDone && collect15Done && reviews5Done && cases20Done && buys6Done && rareWinsDone
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) {
        setDailyTask(null);
        setWeeklyTask(null);
        setAllTasksCompleted(false);
        setHasIncompleteTasks(false);
        return;
      }

      const controller = new AbortController();

      const fetchTasks = async () => {
        try {
          const [dailyRes, weeklyRes] = await Promise.all([
            axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', { signal: controller.signal }),
            axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', { signal: controller.signal }),
          ]);

          const daily = dailyRes.data;
          const weekly = weeklyRes.data;

          setDailyTask(daily);
          setWeeklyTask(weekly);

          const allDone = isDailyCompleted(daily) && isWeeklyCompleted(weekly);
          setAllTasksCompleted(allDone);
          setHasIncompleteTasks(!allDone);
        } catch (e: any) {
          // если ушли со страницы — abort, это не ошибка
          if (e?.name === 'CanceledError') return;

          console.error('tasks fetch error:', e);
          setAllTasksCompleted(false);
          setHasIncompleteTasks(false);
        }
      };

      fetchTasks();

      return () => controller.abort();
    }, [user?.id]),
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get<Product[]>('https://dcc2e55f63f7f47b.mokky.dev/cart');
        setCartProducts(res.data);
      } catch (error) {
        setCartProducts([]);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [removeAllMarks]);

  useEffect(() => {
    if (cartProducts.length !== prevCount.current) {
      // Пуск анимации
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      prevCount.current = cartProducts.length;
    }
  }, [cartProducts.length]);

  return (
    <>
      <View className="px-4 py-5 flex-row items-center justify-between border-b border-[#eaeaea]">
        {/* Logo and title */}
        <View className="flex-row items-center space-x-4">
          <Pressable onPress={() => router.push('/')}>
            <Image
              source={require('../assets/images/sneakers.png')}
              className="w-10 h-10 mr-[10px]"
              accessibilityLabel="logo"
            />
          </Pressable>
          <View>
            <Text className="text-black text-sm font-bold">NATIVE SNEAKERS</Text>
            <Text className="text-[#9d9d9d] text-sm font-normal">The best sneakers store</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-[22px]">
          {user && (
            <Pressable onPress={() => router.push('/tasks')}>
              <View className="relative">
                <FontAwesome5 name="tasks" size={24} color="black" />

                {hasIncompleteTasks && (
                  <View className="absolute top-[-9px] right-[-10px]">
                    <View
                      className="
              h-5 w-5 rounded-full bg-red-500
              items-center justify-center
              shadow
            ">
                      <Text className="text-[11px] text-white font-bold">🔥</Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          )}

          {allTasksCompleted && (
            <View className="absolute top-[-9px] left-[18px]">
              <View className="h-5 w-5 rounded-full bg-emerald-500 items-center justify-center shadow">
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              </View>
            </View>
          )}

          <Pressable onPress={() => router.push('/chat')}>
            <Entypo name="chat" size={24} color="black" />
          </Pressable>

          <Pressable
            className="relative"
            onPress={() => {
              setShowDrawer(true);
            }}>
            <FontAwesome name="shopping-cart" size={24} color="black" />

            {/* badge поверх иконки */}
            {cartProducts.length > 0 && (
              <Animated.View
                style={{ transform: [{ scale: scaleAnim }] }}
                className="absolute top-[-8px] left-[-15px] w-[20px] h-[20px] flex justify-center items-center rounded-[50px] bg-blue-500 z-[10]">
                <Animated.Text className="text-white text-[10px] font-bold">
                  {cartProducts.length}
                </Animated.Text>
              </Animated.View>
            )}
          </Pressable>
        </View>
      </View>

      {/* cart drawer */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
        }}
        size="lg"
        anchor="bottom">
        {/* <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999999,
            elevation: 999999,
          }}>
          <Toast />
        </View> */}

        <DrawerBackdrop />
        <CartDrawerContent
          cartProducts={cartProducts}
          setCartProducts={setCartProducts}
          isLoading={isLoading}
          onCloseDrawer={() => setShowDrawer(false)}
        />
      </Drawer>
    </>
  );
}
