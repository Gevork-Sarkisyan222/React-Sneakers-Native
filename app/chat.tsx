import { getBotReply } from "@/utils/botLocal";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
};

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Привет! Я Arman, ваш помощник. Чем могу помочь?",
      sender: "bot",
      time: "10:00",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    // if (!inputText.trim() || isLoading) return;
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    // setIsLoading(true);

    const botText = await getBotReply(userMsg.text);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: "bot",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, botMsg]);
    // setIsLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      className={`my-1 px-4 ${item.sender === "user" ? "items-end" : "items-start"}`}
    >
      <View
        className={`
        p-3 rounded-2xl max-w-[80%]
        ${
          item.sender === "user"
            ? "bg-[#9dd357] rounded-br-none"
            : "bg-gray-100 rounded-bl-none"
        }
      `}
      >
        <Text
          className={item.sender === "user" ? "text-white" : "text-gray-800"}
        >
          {item.text}
        </Text>
        <Text
          className={`
          text-xs mt-1
          ${item.sender === "user" ? "text-white opacity-80" : "text-gray-500"}
        `}
        >
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="pt-[10px] pb-[15px]"
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        {/* Шапка чата */}
        <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
          <Image
            source={{
              uri: "https://cdn0.iconfinder.com/data/icons/professional-avatar-5/48/Junior_Consultant_male_avatar_men_character_professions-512.png",
            }}
            className="w-[41px] h-[41px] rounded-full mr-3"
          />
          <View>
            <Text className="font-bold text-lg text-gray-900">Arman</Text>
            <Text className="text-[12px] text-gray-500">
              <Text className="text-green-500 font-bold">Онлайн</Text> •
              Помощник - консультант
            </Text>
          </View>
        </View>

        {/* Область сообщений */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          className="flex-1"
        />

        {/* Поле ввода */}
        <KeyboardAvoidingView className="pt-2 border-t border-gray-100">
          <View className="flex-row items-center px-4 pb-4">
            <TextInput
              className="flex-1 border border-gray-200 rounded-full py-3 px-5 mr-3 text-base"
              placeholder="Напишите сообщение..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={sendMessage}
              className={`${inputText ? "bg-[#9dd357]" : "bg-gray-200"} w-12 h-12 rounded-full items-center justify-center`}
            >
              <Text className="text-white text-lg font-bold">➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ChatPage;
