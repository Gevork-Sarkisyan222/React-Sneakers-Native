import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';

interface Props {
  loading?: boolean;
}

const CardSkeleton = ({ loading = true }: Props) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [loading, opacity]);

  if (!loading) return null;

  // calculate width as 48% of the screen minus total horizontal padding (16px on each side)
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CARD_WIDTH = (SCREEN_WIDTH - 32) * 0.48;

  return (
    <Animated.View
      style={{ opacity, width: CARD_WIDTH, height: 260 }}
      className="mb-4 rounded-[40px] bg-white">
      {/* image */}
      <View
        className="bg-gray-200 rounded-[12px]"
        style={{ width: 133, height: 112, marginTop: 20, marginLeft: 20 }}
      />

      {/* title */}
      <View
        className="bg-gray-200 rounded-[4px] mb-2"
        style={{
          width: CARD_WIDTH - 40, // 20px padding left/right
          height: 14,
          marginTop: 10,
          marginLeft: 20,
        }}
      />

      {/* subtitle */}
      <View
        className="bg-gray-200 rounded-[4px] mb-4"
        style={{
          width: (CARD_WIDTH - 40) * 0.8,
          height: 11,
          marginLeft: 20,
        }}
      />

      {/* bottom row */}
      <View className="flex-row items-center justify-between px-5 mt-3">
        {/* price */}
        <View>
          <View className="bg-gray-200 rounded-[4px] mb-1" style={{ width: 30, height: 11 }} />
          <View className="bg-gray-200 rounded-[4px]" style={{ width: 60, height: 14 }} />
        </View>
        {/* button */}
        <View className="bg-gray-200 rounded-[8px]" style={{ width: 32, height: 32 }} />
      </View>
    </Animated.View>
  );
};

export default CardSkeleton;
