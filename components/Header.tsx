import React, { useEffect, useRef } from 'react';
import { Image, Pressable, Text, View, Animated } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ui
import { Drawer, DrawerBackdrop } from '@/components/ui/drawer';
import CartDrawerContent from './cart/CartDrawerContent';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { Product } from '@/constants/Types';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function Header() {
  const [cartProducts, setCartProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(cartProducts.length);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const router = useRouter();
  const removeAllMarks = useSelector((state: RootState) => state.products.removeAllMarks);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get<Product[]>('https://dcc2e55f63f7f47b.mokky.dev/cart-products');
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
              source={{
                uri: 'https://s3-alpha-sig.figma.com/img/58cc/1425/9c4fc1fafb1aa931e9f4ea8af50f59db?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=IZzJFBgjdvIjbJir8TOTE65R7FLvL8ptADu4oFWoZpXmk1IfqOdOBrCea2xsL7LpLp93ZsVMAI7gM79cyy4YBrecMt5MBf499LXCkV8cf7LQLbd4aQQkrGkG5dVM6DGdee~ie22fmaK~n2epcXFV~qSABJShmlwsoHhDrnIZ1ZaS9r7mbslv3JDS0H-7J0e92zO7ApOWKJKHYEfou-L7nE0YJkcop9I~ALhaS4llEHbjUGQcayelKXP-J4eIH0tW-VNcqw7ysA~tGQZ5hcRMSzuMs-d0-p4sxtfk0UCR22DYuje29FCrWK1m51yyiowk8AlJHD59Ar1C0RiW0rQyeg__',
              }}
              className="w-10 h-10 mr-[10px]"
              accessibilityLabel="logo"
            />
          </Pressable>
          <View>
            <Text className="text-black text-sm font-bold">REACT SNEAKERS</Text>
            <Text className="text-[#9d9d9d] text-sm font-normal">Магазин лучших кроссовок</Text>
          </View>
        </View>

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

      {/* cart drawer */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
        }}
        size="lg"
        anchor="bottom">
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
