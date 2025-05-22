import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';

type User = {
  id: number;
  name: string;
  lastName: string;
  avatarUri: string;
  position: string;
};

type Props = {};

const UsersList: React.FC<Props> = ({}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // ЗАГРУЗКА СПИСКА ПОЛЬЗОВАТЕЛЕЙ
    axios
      .get<User[]>('https://dcc2e55f63f7f47b.mokky.dev/users')
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке пользователей:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="p-4 bg-white rounded-lg">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          let label = '';
          let bgClass = '';
          let textClass = '';

          if (item.position === 'superadmin') {
            label = 'Super Admin';
            bgClass = 'bg-green-100';
            textClass = 'text-green-600';
          } else if (item.position === 'admin') {
            label = 'Admin';
            bgClass = 'bg-blue-100';
            textClass = 'text-blue-600';
          }

          return (
            <View className="flex-row items-center mb-4">
              {/* АВАТАР */}
              <Image source={{ uri: item.avatarUri }} className="w-12 h-12 rounded-full mr-4" />
              {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ */}
              <View className="flex-1">
                <Text className="text-lg font-bold">{`${item.name} ${item.lastName}`}</Text>
              </View>
              {/* МЕТКА */}
              {label !== '' && (
                <View className={`${bgClass} px-2 py-1 rounded-full`}>
                  <Text className={`text-sm font-semibold ${textClass}`}>{label}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default UsersList;
