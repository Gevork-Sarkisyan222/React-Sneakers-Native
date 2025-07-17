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
  TextInput,
} from "react-native";
import axios from "axios";
import { useGetUser } from "@/hooks/useGetUser";

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
  const [blockOption, setBlockOption] = useState<15 | 30 | "forever" | null>(
    null
  );

  const [blockReason, setBlockReason] = useState<string>("");

  const [selectedBlockUserId, setSelectedBlockUserId] = useState<number | null>(
    null
  );

  // test 555 for position modal
  const [openPositionModal, setOpenPositionModal] = useState(false);
  const [savedPosName, setSavedPosName] = useState<string | null>(null);
  const [selectedPositionUserId, setSelectedPositionUserId] = useState<
    number | null
  >(null);
  const [selectedPositionOption, setSelectedPositionOption] =
    useState<any>(null);
  const [selectedFullName, setSelectedFullName] = useState<string | null>(null);
  // test 555 for position modal

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
    } else if (user.position === "owner") {
      return "Владелец";
    } else {
      return "";
    }
  };

  const renderItemPostion = (position: string) => {
    if (position === "superadmin") {
      return "Глав.Админ";
    } else if (position === "admin") {
      return "Админ";
    } else if (position === "user") {
      return "Пользователь";
    } else {
      return "";
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
    setBlockReason("");
  };

  const handleConfirmBlock = async () => {
    if (blockReason === "") {
      return Alert.alert(
        "Ошибка",
        "Вы не ввели причину блокировки. Пожалуйста, введите причину."
      );
    }

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
          blockReason,
          blockedBy:
            user && user.position
              ? `${
                  user.position === "owner"
                    ? "Владельцем"
                    : "Глав.Администратором"
                } ${user.name} ${user.lastName}`
              : "",
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
        blockReason: null,
        blockedBy: null,
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

  const positionOptions = [
    { value: "user", label: "Пользователь" },
    { value: "admin", label: "Администратор" },
    // добавляем супер‑админа только для owner
    ...(user?.position === "owner"
      ? [{ value: "superadmin", label: "Главный администратор" }]
      : []),
  ] as const;

  const handleOpenPositionModal = (
    userId: number,
    position: string,
    fullName: string
  ) => {
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
      await axios.patch(
        `https://dcc2e55f63f7f47b.mokky.dev/users/${selectedPositionUserId}`,
        {
          position: selectedPositionOption,
        }
      );

      // Обновляем локальный стейт пользователей после назначения
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedPositionUserId
            ? { ...u, position: selectedPositionOption }
            : u
        )
      );

      Alert.alert(
        "Готово",
        `Пользователь ${selectedFullName} назначен на позицию ${renderItemPostion(
          selectedPositionOption
        )}`
      );

      handleClosePositionModal();
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось назначить пользователя на позицию");
      console.error(error);
    }
  };

  return (
    <>
      {/* position modal */}
      {openPositionModal && (
        <Modal visible animationType="slide" transparent>
          {/* Полупрозрачный фон */}
          <Pressable
            className="flex-1 justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onPress={handleClosePositionModal}
          >
            {/* Само модальное окно */}
            <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
              {/* Заголовок */}
              <Text className="text-lg font-semibold mb-4">Права доступа</Text>

              <Text className="text-base font-medium mb-2">
                текущая позиция:{" "}
                <Text
                  className={`${
                    savedPosName === "user" ? "text-black" : "text-blue-600"
                  }`}
                >
                  {renderItemPostion(savedPosName ?? "")}
                </Text>
              </Text>

              {/* Выбор роли */}
              <Text className="text-base font-medium mb-2">
                Назначить позицию для: {selectedFullName}
              </Text>
              {positionOptions.map(({ value, label }) => {
                const isSelected = selectedPositionOption === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelectedPositionOption(value)}
                    className={`px-4 py-2 rounded-lg mb-3 border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-blue-600"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Кнопка подтверждения */}
              <Pressable
                onPress={handleConfirmSettedPosition}
                className="mt-4 bg-blue-600 px-4 py-2 rounded-lg shadow-sm active:bg-blue-700"
              >
                <Text className="text-center text-white font-semibold">
                  Применить
                </Text>
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
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onPress={handleCloseBlockkModal}
          >
            <Pressable className="bg-white rounded-2xl p-6" onPress={() => {}}>
              <Text className="text-lg font-semibold mb-4">
                Меню блокировки
              </Text>
              {/* ИНПУТ ПРИЧИНЫ БАНА */}
              <TextInput
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="Введите причину блокировки"
                multiline
                numberOfLines={4}
                className="bg-white border-b-2 border-red-400 px-2 py-3 mb-4 text-base placeholder:text-red-600"
                placeholderTextColor="#f43f5e"
              />

              <Text className="text-lg font-semibold mb-4">
                Выберите срок блокировки
              </Text>

              {/* Варианты сроков блокировки */}
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
                            : item.position === "owner"
                            ? "text-red-600 underline owner-font"
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
                      {item.id !== user?.id &&
                        (item.position === "user" ||
                          item.position === "admin" ||
                          item.position === "superadmin") && (
                          <Pressable
                            // onPress={() => handleMakeAdmin(item.id)}
                            onPress={() =>
                              handleOpenPositionModal(
                                item.id,
                                item.position,
                                item.name + " " + item.lastName
                              )
                            }
                            className="bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-blue-100"
                          >
                            <Text className="text-sm text-blue-600 font-semibold">
                              {/* Сделать админом */}
                              {item.position === "user"
                                ? "Выдать права"
                                : "Повысить/Понизить права"}
                            </Text>
                          </Pressable>
                        )}
                    </View>

                    {!item.isBlocked &&
                      // OWNER блокирует всех, кроме других OWNER
                      ((user?.position === "owner" &&
                        item.position !== "owner") ||
                        // SUPERADMIN блокирует только админов и юзеров
                        (user?.position === "superadmin" &&
                          item.position !== "superadmin" &&
                          item.position !== "owner")) && (
                        <Pressable
                          onPress={() => handleOpenBlockModal(item.id)}
                          className="bg-red-50 border border-red-300 px-3 py-1.5 rounded-lg self-start mt-2 shadow-sm active:bg-red-100"
                        >
                          <Text className="text-sm text-red-600 font-semibold">
                            Заблокировать
                          </Text>
                        </Pressable>
                      )}

                    {item.isBlocked &&
                      // OWNER разблокирует всех, кроме других OWNER
                      ((user?.position === "owner" &&
                        item.position !== "owner") ||
                        // SUPERADMIN разблокирует только админов и юзеров
                        (user?.position === "superadmin" &&
                          item.position !== "superadmin" &&
                          item.position !== "owner")) && (
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
