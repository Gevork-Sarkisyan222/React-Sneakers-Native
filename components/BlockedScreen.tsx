import { useGetUser } from '@/hooks/useGetUser';
import { View, Text, Pressable, Linking, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export function BlockedScreen({
  adminName,
  reason,
  banUntil,
}: {
  adminName: string;
  reason?: string;
  banUntil?: string | null;
}) {
  const { fetchUser } = useGetUser({ pathname: 'profile' });

  const untilText = banUntil ? `until ${new Date(banUntil).toLocaleDateString()}` : 'forever';

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('userToken');
              fetchUser();
              Alert.alert('Logged out', 'You have successfully logged out of your account');
              router.replace('/login');
            } catch (error) {
              console.error('Error while logging out:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      {/* Title */}
      <Text className="text-3xl font-extrabold text-red-600 mb-4 text-center">Account Blocked</Text>

      {/* Info block */}
      <Text className="text-center text-base text-gray-800 mb-6 leading-relaxed">
        Your account has been blocked by{' '}
        <Text className="font-semibold text-gray-900">{adminName}</Text> {untilText}.
      </Text>

      {/* Reason block */}
      {reason && (
        <View className="w-full bg-red-100 border-l-4 border-red-500 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-red-700 mb-1">Reason:</Text>
          <Text className="text-sm text-red-900">{reason}</Text>
        </View>
      )}

      <View className="flex-row space-x-4 gap-[15px]">
        <Pressable
          onPress={() => {
            Linking.openURL('https://t.me/gevork_sarkisyan');
          }}
          className="flex-1 bg-blue-600 px-4 py-3 rounded-full shadow-sm active:bg-blue-700 items-center">
          <Text className="text-white font-semibold text-sm">Support</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="flex-1 bg-gray-200 px-4 py-3 rounded-full shadow-sm active:bg-gray-300 items-center">
          <Text className="text-gray-800 font-semibold text-sm">Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}
