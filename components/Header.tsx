import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ui
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import CartCard from './cart/CartCard';
import CartDrawerContent from './cart/CartDrawerContent';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

export default function Header() {
  const [showDrawer, setShowDrawer] = React.useState(false);
  const router = useRouter();

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
          onPress={() => {
            setShowDrawer(true);
          }}>
          <FontAwesome name="shopping-cart" size={24} color="black" />
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
        <CartDrawerContent onCloseDrawer={() => setShowDrawer(false)} />
      </Drawer>
    </>
  );
}
