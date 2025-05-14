import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NotFoundScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      {/* Анимация Lottie */}

      {/* Заголовок */}
      <Text className="text-2xl font-bold text-gray-800 mt-6">Упс! Страница не найдена</Text>

      {/* Описание */}
      <Text className="text-gray-500 text-center mt-2 px-4">
        Страница, которую вы ищете, не существует или была перемещена.
      </Text>

      {/* Кнопка Назад */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="mt-6 px-6 py-3 bg-blue-600 rounded-full">
        <Text className="text-white font-semibold text-lg">Назад</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotFoundScreen;
