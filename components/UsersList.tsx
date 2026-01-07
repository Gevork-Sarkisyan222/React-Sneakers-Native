import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { useGetUser } from '@/hooks/useGetUser';

type User = {
  id: number;
  name: string;
  lastName: string;
  avatarUri: string;
  position: string;

  isBlocked: boolean;
  banStart?: null | string;
  banUntil?: null | string;
};

type Props = {};

const UsersList: React.FC<Props> = ({}) => {
  const { user } = useGetUser({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockOption, setBlockOption] = useState<15 | 30 | 'forever' | null>(null);

  const [blockReason, setBlockReason] = useState<string>('');

  const [selectedBlockUserId, setSelectedBlockUserId] = useState<number | null>(null);

  // test 555 for position modal
  const [openPositionModal, setOpenPositionModal] = useState(false);
  const [savedPosName, setSavedPosName] = useState<string | null>(null);
  const [selectedPositionUserId, setSelectedPositionUserId] = useState<number | null>(null);
  const [selectedPositionOption, setSelectedPositionOption] = useState<any>(null);
  const [selectedFullName, setSelectedFullName] = useState<string | null>(null);
  // test 555 for position modal

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

  const writeUserPosition = (user: User) => {
    if (user.position === 'superadmin') {
      return 'Main Admin';
    } else if (user.position === 'admin') {
      return 'Admin';
    } else if (user.position === 'owner') {
      return 'Owner';
    } else {
      return '';
    }
  };

  const renderItemPostion = (position: string) => {
    if (position === 'superadmin') {
      return 'Main Admin';
    } else if (position === 'admin') {
      return 'Admin';
    } else if (position === 'user') {
      return 'User';
    } else {
      return '';
    }
  };

  const handleOpenBlockModal = (userId: number) => {
    setBlockModalVisible(true);

    // give id from render
    setSelectedBlockUserId(userId);
  };

  const handleCloseBlockkModal = () => {
    setBlockModalVisible(false);
    setBlockOption(null);
    setSelectedBlockUserId(null);
    setBlockReason('');
  };

  const handleConfirmBlock = async () => {
    if (blockReason === '') {
      return Alert.alert('Error', 'You did not enter a block reason. Please enter a reason.');
    }

    if (selectedBlockUserId == null || blockOption == null) {
      return Alert.alert('Error', 'You did not select a block duration. Please select a duration.');
    }

    // Current time in ISO format
    const now = new Date();
    const banStart = now.toISOString();

    // If "forever" option → ban forever, otherwise calculate the end date
    const banUntil =
      blockOption === 'forever'
        ? null
        : new Date(now.getTime() + blockOption * 24 * 60 * 60 * 1000).toISOString();

    try {
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${selectedBlockUserId}`, {
        isBlocked: true,
        banStart,
        banUntil,
        blockReason,
        blockedBy:
          user && user.position
            ? `${user.position === 'owner' ? 'By the Owner' : 'By the Main Administrator'} ${
                user.name
              } ${user.lastName}`
            : '',
      });

      // Update local users state
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedBlockUserId ? { ...u, isBlocked: true } : u)),
      );

      Alert.alert(
        'Done',
        blockOption === 'forever'
          ? 'The user has been permanently blocked'
          : `The user has been blocked for ${blockOption} days`,
      );
    } catch (error) {
      console.error('Error while blocking:', error);
      Alert.alert('Error', 'Failed to block the user');
    } finally {
      handleCloseBlockkModal();
    }
  };

  const handleUnblockUser = async (userId: number, userName: string) => {
    try {
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${userId}`, {
        isBlocked: false,
        banStart: null,
        banUntil: null,
        blockReason: null,
        blockedBy: null,
      });

      // Update local users state
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u)));

      Alert.alert('Done', `User ${userName} has been unblocked`);
    } catch (error) {
      console.error('Error while unblocking:', error);
      Alert.alert('Error', 'Failed to unblock the user');
    }
  };

  const positionOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Administrator' },
    // add super-admin only for owner
    ...(user?.position === 'owner' ? [{ value: 'superadmin', label: 'Main Administrator' }] : []),
  ] as const;

  const handleOpenPositionModal = (userId: number, position: string, fullName: string) => {
    setOpenPositionModal(true);

    // actions
    setSavedPosName(position);
    setSelectedPositionUserId(userId);
    setSelectedPositionOption(position);
    setSelectedFullName(fullName);
  };

  const handleClosePositionModal = () => {
    setOpenPositionModal(false);
    setSavedPosName(null);
    setSelectedPositionUserId(null);
    setSelectedPositionOption(null);
    setSelectedFullName(null);
  };

  // функция назначение positon
  const handleConfirmSettedPosition = async () => {
    try {
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${selectedPositionUserId}`, {
        position: selectedPositionOption,
      });

      // Update local users state after assigning
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedPositionUserId ? { ...u, position: selectedPositionOption } : u,
        ),
      );

      Alert.alert(
        'Done',
        `User ${selectedFullName} has been assigned to the position ${renderItemPostion(
          selectedPositionOption,
        )}`,
      );

      handleClosePositionModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign the user to the position');
      console.error(error);
    }
  };

  return (
    <>
      {/* position modal */}
      {openPositionModal && (
        <Modal visible animationType="slide" transparent>
          {/* Semi-transparent backdrop */}
          <Pressable
            className="flex-1 justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onPress={handleClosePositionModal}>
            {/* The modal window itself */}
            <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
              {/* Title */}
              <Text className="text-lg font-semibold mb-4">Access Permissions</Text>

              <Text className="text-base font-medium mb-2">
                current position:{' '}
                <Text className={`${savedPosName === 'user' ? 'text-black' : 'text-blue-600'}`}>
                  {renderItemPostion(savedPosName ?? '')}
                </Text>
              </Text>

              {/* Role selection */}
              <Text className="text-base font-medium mb-2">
                Assign position for: {selectedFullName}
              </Text>
              {positionOptions.map(({ value, label }) => {
                const isSelected = selectedPositionOption === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelectedPositionOption(value)}
                    className={`px-4 py-2 rounded-lg mb-3 border ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'bg-blue-50 border-blue-300'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-blue-600'
                      }`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Confirm button */}
              <Pressable
                onPress={handleConfirmSettedPosition}
                className="mt-4 bg-blue-600 px-4 py-2 rounded-lg shadow-sm active:bg-blue-700">
                <Text className="text-center text-white font-semibold">Apply</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* end of position modal */}

      {/* block modal */}
      {blockModalVisible && (
        <Modal visible animationType="slide" transparent>
          <Pressable
            className="flex-1 justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onPress={handleCloseBlockkModal}>
            <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
              <Text className="text-lg font-semibold mb-4">Blocking Menu</Text>
              {/* BAN REASON INPUT */}
              <TextInput
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="Enter the reason for blocking"
                multiline
                numberOfLines={4}
                className="bg-white border-b-2 border-red-400 px-2 py-3 mb-4 text-base placeholder:text-red-600"
                placeholderTextColor="#f43f5e"
              />

              <Text className="text-lg font-semibold mb-4">Select the block duration</Text>

              {/* Block duration options */}
              {([15, 30, 'forever'] as const).map((opt) => {
                const label = opt === 'forever' ? 'Forever' : `${opt} days`;
                const isSelected = blockOption === opt;
                return (
                  <Pressable
                    key={String(opt)}
                    onPress={() => setBlockOption(opt)}
                    className={`px-4 py-2 rounded-lg mb-3 border ${
                      isSelected ? 'bg-red-600 border-red-600' : 'bg-red-50 border-red-300'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-red-600'
                      }`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={handleConfirmBlock}
                className="mt-4 bg-red-600 px-4 py-2 rounded-lg shadow-sm active:bg-red-700">
                <Text className="text-center text-white font-semibold">Confirm and block</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {/* end of blcok modal */}

      <View className="p-4 bg-white rounded-lg">
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            return (
              <View className="flex-col items-start mb-4 p-2 px-[10px] border-[black] border-[1px] rounded-[10px]">
                {/* AVATAR */}
                <View className="flex flex-row items-start">
                  <Image source={{ uri: item.avatarUri }} className="w-12 h-12 rounded-full mr-4" />
                  {/* USER INFO */}
                  <View className="flex flex-col">
                    <Text className="text-lg whitespace-nowrap font-bold">
                      <Text
                        className={`font-bold ${
                          item.position === 'admin'
                            ? 'text-black underline'
                            : item.position === 'superadmin'
                              ? 'text-blue-700 underline'
                              : item.position === 'owner'
                                ? 'text-red-600 underline owner-font'
                                : 'text-gray-700'
                        }`}>
                        {writeUserPosition(item)}{' '}
                      </Text>
                      {/* ← added space */}
                      {item.position === 'admin' ? item.name : `${item.name} ${item.lastName}`}
                    </Text>

                    <View className="flex flex-row gap-[10px]">
                      {item.id !== user?.id &&
                        (item.position === 'user' ||
                          item.position === 'admin' ||
                          item.position === 'superadmin') && (
                          <Pressable
                            // onPress={() => handleMakeAdmin(item.id)}
                            onPress={() =>
                              handleOpenPositionModal(
                                item.id,
                                item.position,
                                item.name + ' ' + item.lastName,
                              )
                            }
                            className="bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-blue-100">
                            <Text className="text-sm text-blue-600 font-semibold">
                              {/* Make admin */}
                              {item.position === 'user'
                                ? 'Grant permissions'
                                : 'Promote/Demote permissions'}
                            </Text>
                          </Pressable>
                        )}
                    </View>

                    {!item.isBlocked &&
                      // OWNER blocks everyone except other OWNERs
                      ((user?.position === 'owner' && item.position !== 'owner') ||
                        // SUPERADMIN blocks only admins and users
                        (user?.position === 'superadmin' &&
                          item.position !== 'superadmin' &&
                          item.position !== 'owner')) && (
                        <Pressable
                          onPress={() => handleOpenBlockModal(item.id)}
                          className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100">
                          <Text className="text-sm text-red-600 font-semibold">Block</Text>
                        </Pressable>
                      )}

                    {item.isBlocked &&
                      // OWNER unblocks everyone except other OWNERs
                      ((user?.position === 'owner' && item.position !== 'owner') ||
                        // SUPERADMIN unblocks only admins and users
                        (user?.position === 'superadmin' &&
                          item.position !== 'superadmin' &&
                          item.position !== 'owner')) && (
                        <Pressable
                          onPress={() =>
                            handleUnblockUser(item.id, item.name + ' ' + item.lastName)
                          }
                          className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100">
                          <Text className="text-sm text-red-600 font-semibold">Unblock</Text>
                        </Pressable>
                      )}
                  </View>
                </View>

                {/* LABEL */}
                {/* {label !== "" && (
        <View className={`${bgClass} px-2 py-1 rounded-full`}>
          <Text className={`text-sm font-semibold ${textClass}`}>
            {label}
          </Text>
        </View>
      )} */}
              </View>
            );
          }}
        />
      </View>
    </>
  );
};

export default UsersList;
