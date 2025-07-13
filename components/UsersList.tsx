import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import axios from "axios";

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockOption, setBlockOption] = useState<15 | 30 | "forever" | null>(
    null
  );

  const [selectedBlockUserId, setSelectedBlockUserId] = useState<number | null>(
    null
  );

  useEffect(() => {
    // ЗАГРУЗКА СПИСКА ПОЛЬЗОВАТЕЛЕЙ
    axios
      .get<User[]>("https://dcc2e55f63f7f47b.mokky.dev/users")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке пользователей:", error);
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
    if (user.position === "superadmin") {
      return "Глав.Админ";
    } else if (user.position === "admin") {
      return "Админ";
    } else {
      return "";
    }
  };

  // функции для пользователей и админов
  const handleMakeAdmin = async (userId: number) => {
    await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/users/${userId}`, {
      position: "admin",
    });

    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          return { ...user, position: "admin" };
        }
        return user;
      })
    );
  };

  const handleRemoveAdmin = (userId: number, username: string) => {
    Alert.alert(
      "Подтверждение",
      `Вы точно хотите снять с поста администратора "${username}"?`,
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Да",
          style: "destructive",
          onPress: async () => {
            await axios.patch(
              `https://dcc2e55f63f7f47b.mokky.dev/users/${userId}`,
              {
                position: "user",
              }
            );

            setUsers((prevUsers) =>
              prevUsers.map((user) => {
                if (user.id === userId) {
                  return { ...user, position: "user" }; // ТЫПКА здесь было "poistion" — исправил на "position"
                }
                return user;
              })
            );
          },
        },
      ]
    );
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
  };

  const handleConfirmBlock = async () => {
    if (selectedBlockUserId == null || blockOption == null) {
      return Alert.alert(
        "Ошибка",
        "Вы не выбрали срок блокировки. Пожалуйста, выберите срок."
      );
    }

    // Текущее время в ISO-формате
    const now = new Date();
    const banStart = now.toISOString();

    // Если опция "forever" → бан навсегда, иначе рассчитываем дату окончания
    const banUntil =
      blockOption === "forever"
        ? null
        : new Date(
            now.getTime() + blockOption * 24 * 60 * 60 * 1000
          ).toISOString();

    try {
      await axios.patch(
        `https://dcc2e55f63f7f47b.mokky.dev/users/${selectedBlockUserId}`,
        {
          isBlocked: true,
          banStart,
          banUntil,
        }
      );

      // Обновляем локальный стейт пользователей
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedBlockUserId ? { ...u, isBlocked: true } : u
        )
      );

      Alert.alert(
        "Готово",
        blockOption === "forever"
          ? "Пользователь заблокирован навсегда"
          : `Пользователь заблокирован на ${blockOption} дней`
      );
    } catch (error) {
      console.error("Ошибка при блокировке:", error);
      Alert.alert("Ошибка", "Не удалось заблокировать пользователя");
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
      });

      // Обновляем локальный стейт пользователей
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u))
      );

      Alert.alert("Готово", `Пользователь ${userName} разблокирован`);
    } catch (error) {
      console.error("Ошибка при разблокировке:", error);
      Alert.alert("Ошибка", "Не удалось разблокировать пользователя");
    }
  };

  return (
    <>
      {/* block modal */}
      {blockModalVisible && (
        <Modal visible animationType="slide" transparent>
          <Pressable
            className="flex-1 justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onPress={handleCloseBlockkModal}
          >
            <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
              <Text className="text-lg font-semibold mb-4">
                Выберите срок блокировки
              </Text>

              {([15, 30, "forever"] as const).map((opt) => {
                const label = opt === "forever" ? "Навсегда" : `${opt} дней`;
                const isSelected = blockOption === opt;
                return (
                  <Pressable
                    key={String(opt)}
                    onPress={() => setBlockOption(opt)}
                    className={`px-4 py-2 rounded-lg mb-3 border ${
                      isSelected
                        ? "bg-red-600 border-red-600"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-red-600"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={handleConfirmBlock}
                className="mt-4 bg-red-600 px-4 py-2 rounded-lg shadow-sm active:bg-red-700"
              >
                <Text className="text-center text-white font-semibold">
                  Подтвердить и заблокировать
                </Text>
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
                {/* АВАТАР */}
                <View className="flex flex-row items-start">
                  <Image
                    source={{ uri: item.avatarUri }}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ */}
                  <View className="flex flex-col">
                    <Text className="text-lg whitespace-nowrap font-bold">
                      <Text
                        className={`font-bold ${
                          item.position === "admin"
                            ? "text-black underline"
                            : item.position === "superadmin"
                            ? "text-blue-700 underline"
                            : "text-gray-700"
                        }`}
                      >
                        {writeUserPosition(item)}{" "}
                      </Text>
                      {/* ← добавлен пробел */}
                      {item.position === "admin"
                        ? item.name
                        : `${item.name} ${item.lastName}`}
                    </Text>

                    <View className="flex flex-row gap-[10px]">
                      {item.position === "admin" && (
                        <Pressable
                          onPress={() => handleRemoveAdmin(item.id, item.name)}
                          className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100"
                        >
                          <Text className="text-sm text-red-600 font-semibold">
                            Снять с поста админа
                          </Text>
                        </Pressable>
                      )}

                      {item.position === "user" && (
                        <Pressable
                          onPress={() => handleMakeAdmin(item.id)}
                          className="bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-blue-100"
                        >
                          <Text className="text-sm text-blue-600 font-semibold">
                            Сделать админом
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {item.position !== "superadmin" && !item.isBlocked && (
                      <Pressable
                        onPress={() => handleOpenBlockModal(item.id)}
                        className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100"
                      >
                        <Text className="text-sm text-red-600 font-semibold">
                          Заблокировать
                        </Text>
                      </Pressable>
                    )}

                    {item.position !== "superadmin" && item.isBlocked && (
                      <Pressable
                        onPress={() =>
                          handleUnblockUser(
                            item.id,
                            item.name + " " + item.lastName
                          )
                        }
                        className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100"
                      >
                        <Text className="text-sm text-red-600 font-semibold">
                          Разблокировать
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* МЕТКА */}
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
