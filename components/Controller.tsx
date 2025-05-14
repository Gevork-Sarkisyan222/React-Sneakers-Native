import { AppSettingsType, SettingsPayload } from '@/constants/Types';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, TextInput } from 'react-native';

type Props = {
  onCloseModal: () => void;
  setModalTypeController: (value: boolean) => void;
  isVisible: boolean;
};

export default function Controller({ onCloseModal, setModalTypeController, isVisible }: Props) {
  const [summerSale, setSummerSale] = useState(false);
  const [blackFriday, setBlackFriday] = useState(false);
  const [promoActive, setPromoActive] = useState(false);

  // Поле для ввода скидки input
  const [promoDiscount, setPromoDiscount] = useState('');

  // Утилитарная функция для патча с новым типом
  const patchSetting = async (payload: SettingsPayload) => {
    try {
      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/app-settings/1', payload);
    } catch (err) {
      console.error('Ошибка при сохранении настроек', err);
      alert('Не удалось сохранить изменения');
    }
  };

  // Летняя распродажа
  const onToggleSummerSale = async (val: boolean) => {
    setSummerSale(val);
    await patchSetting({ summer_sale: val });
  };

  // Чёрная пятница
  const onToggleBlackFriday = async (val: boolean) => {
    setBlackFriday(val);
    await patchSetting({ black_friday: val });
  };

  // Глобальная акция (открытие поля для ввода)
  const onTogglePromoActive = (val: boolean) => {
    setPromoActive(val);
    if (!val) {
      setPromoDiscount('');
      patchSetting({ sale: false, sale_discount: 0 });
    }
  };

  // Изменение скидки в input
  const handleDiscountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let num = parseInt(cleaned, 10);
    if (isNaN(num)) {
      setPromoDiscount('');
    } else if (num > 100) {
      setPromoDiscount('100');
    } else {
      setPromoDiscount(num.toString());
    }
  };

  // Отправка при "Запустить"
  const handleStartPromo = async () => {
    if (promoActive && promoDiscount === '') {
      alert('Введите скидку');
      return;
    }
    await patchSetting({ sale: promoActive, sale_discount: Number(promoDiscount) });
    onCloseModal();
    setModalTypeController(false);
  };

  // Загрузка настроек при открытии
  const fetchData = async () => {
    try {
      const { data } = await axios.get<AppSettingsType[]>(
        'https://dcc2e55f63f7f47b.mokky.dev/app-settings',
      );
      const settings = data[0];
      setSummerSale(settings.summer_sale);
      setBlackFriday(settings.black_friday);
      setPromoActive(settings.sale);
      // Если скидка 0 или undefined, оставляем пустым для placeholder
      setPromoDiscount(
        settings.sale_discount && settings.sale_discount > 0
          ? settings.sale_discount.toString()
          : '',
      );
    } catch (err) {
      console.error('Не удалось загрузить данные', err);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  return (
    <View className="p-4 bg-white rounded-2xl">
      <Text className="text-2xl font-semibold text-gray-800 mb-6">Настройки приложения</Text>

      {/* Сезонные предложения */}
      <View className="mb-6">
        <Text className="text-[16px] font-medium text-gray-800 mb-[10px]">
          Сезонные предложения
        </Text>
        <View className="flex-row justify-between items-center mb-[5px]">
          <Text className="text-base text-gray-700">Летняя распродажа</Text>
          <Switch
            value={summerSale}
            onValueChange={onToggleSummerSale}
            trackColor={{ false: '#ccc', true: '#9DD458' }}
            thumbColor="#fff"
          />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-base text-gray-700">Чёрная пятница</Text>
          <Switch
            value={blackFriday}
            onValueChange={onToggleBlackFriday}
            trackColor={{ false: '#ccc', true: '#9DD458' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Глобальная акция */}
      <View className="mb-6">
        <Text className="text-[16px] font-medium text-gray-800">Глобальная акция</Text>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-base text-gray-700">Устроить акцию</Text>
          <Switch
            value={promoActive}
            onValueChange={onTogglePromoActive}
            trackColor={{ false: '#ccc', true: '#9DD458' }}
            thumbColor="#fff"
          />
        </View>
        {promoActive && (
          <TextInput
            placeholder="Скидка (%)"
            value={promoDiscount}
            keyboardType="numeric"
            onChangeText={handleDiscountChange}
            className="bg-gray-100 p-3 rounded-lg"
            maxLength={3}
          />
        )}
      </View>

      {/* Кнопки */}
      <View className="flex-row justify-end space-x-4">
        <TouchableOpacity
          onPress={() => {
            onCloseModal();
            setModalTypeController(false);
          }}
          className="px-5 py-2">
          <Text className="text-gray-700 uppercase">Отмена</Text>
        </TouchableOpacity>

        {promoActive && (
          <TouchableOpacity
            onPress={handleStartPromo}
            className="px-5 py-2 bg-[#9DD458] rounded-2xl shadow shadow-yellow-300">
            <Text className="text-white uppercase">Запустить</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
