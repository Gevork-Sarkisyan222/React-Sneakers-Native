import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

type Props = {
  onCloseModal: () => void;
  setModalTypeController: (value: boolean) => void;
};

export default function Controller({ onCloseModal, setModalTypeController }: Props) {
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSave = () => {
    // Здесь можно отправить данные на сервер
    console.log({ title, discount, startDate, endDate });
    onCloseModal();
    setModalTypeController(false);
  };

  return (
    <View className="p-4 bg-white rounded-2xl">
      <Text className="text-2xl font-semibold text-gray-800 mb-4">Новая акция</Text>

      <TextInput
        placeholder="Название акции"
        value={title}
        onChangeText={setTitle}
        className="bg-gray-100 p-3 rounded-lg mb-3"
      />

      <TextInput
        placeholder="Скидка (%)"
        value={discount}
        keyboardType="numeric"
        onChangeText={setDiscount}
        className="bg-gray-100 p-3 rounded-lg mb-3"
      />

      <TextInput
        placeholder="Дата начала (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        className="bg-gray-100 p-3 rounded-lg mb-3"
      />

      <TextInput
        placeholder="Дата окончания (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
        className="bg-gray-100 p-3 rounded-lg mb-5"
      />

      <View className="flex-row justify-end space-x-4">
        <TouchableOpacity
          onPress={() => {
            onCloseModal();
            setModalTypeController(false);
          }}
          className="px-5 py-2">
          <Text className="text-gray-700 uppercase">Отмена</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          className="px-5 py-2 bg-blue-600 rounded-2xl shadow shadow-blue-300">
          <Text className="text-white uppercase">Сохранить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
