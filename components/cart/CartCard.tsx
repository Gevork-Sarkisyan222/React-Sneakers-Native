import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

interface Props {
  title: string;
  price: string;
  imgUrl: string;
  handleRemove: () => void;
}

const CartCard: React.FC<Props> = ({ title, price, imgUrl, handleRemove }) => {
  return (
    <View className="py-[30px] pr-[30px] pl-[15px] rounded-[20px] h-[119px] border-[1px] border-[#F3F3F3] bg-white flex flex-row relative mb-[20px] items-center">
      <Image
        className="mr-[15px]"
        width={100}
        height={100}
        resizeMode="contain"
        source={{ uri: imgUrl }}
      />

      <View className="flex flex-col justify-center">
        <Text className="text-[14px] max-w-[200px]" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        <Text className="font-bold text-[14px]">{price} руб.</Text>
      </View>

      <Pressable
        onPress={handleRemove}
        className="w-[32px] h-[32px] flex justify-center items-center right-[15px] bottom-1 mb-2 absolute">
        <Feather name="x" size={24} color="#B5B5B5" />
      </Pressable>
    </View>
  );
};

export default CartCard;
