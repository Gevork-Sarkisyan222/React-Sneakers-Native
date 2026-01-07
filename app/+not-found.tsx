import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const NotFoundScreen: React.FC = () => {
  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-2xl font-bold text-gray-800 mt-6">Oops! Page not found</Text>

      <Text className="text-gray-500 text-center mt-2 px-4">
        The page you’re looking for doesn’t exist or has been moved.
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-6 px-6 py-3 bg-blue-600 rounded-full">
        <Text className="text-white font-semibold text-lg">Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotFoundScreen;
