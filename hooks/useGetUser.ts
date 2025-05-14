import { UserInterface } from '@/constants/Types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

interface UseGetUserProps {
  pathname?: string;
}

interface UseGetUserResult {
  user: UserInterface | null;
  isLoading: boolean;
  error: boolean;
  fetchUser: () => Promise<void>;
}
export function useGetUser({ pathname }: UseGetUserProps): UseGetUserResult {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) throw new Error('Token not found');

      const { data } = await axios.get('https://dcc2e55f63f7f47b.mokky.dev/auth_me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setError(false);
      setUser(data);
    } catch (error) {
      // 👇👇👇👇 МОЖЕТ ПРИГОДИТЬСЯ krna petq qal not delete down НЕ УДАЛИ КОММЕНТАРИИ MUST HAVE >>>>>>>>> 👇👇👇

      // Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
      setUser(null);
      setError(true);
      console.error('Ошибка при загрузке пользователя:', error);
      await SecureStore.deleteItemAsync('userToken');
      if (pathname === 'profile') {
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, []),
  );

  return { user, isLoading, error, fetchUser };
}
