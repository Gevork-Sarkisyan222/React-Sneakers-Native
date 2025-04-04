import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NotFoundScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      {/* Lottie Animation */}

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-800 mt-6">Oops! Page Not Found</Text>

      {/* Description */}
      <Text className="text-gray-500 text-center mt-2 px-4">
        The page you are looking for doesn't exist or has been moved.
      </Text>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="mt-6 px-6 py-3 bg-blue-600 rounded-full">
        <Text className="text-white font-semibold text-lg">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotFoundScreen;
