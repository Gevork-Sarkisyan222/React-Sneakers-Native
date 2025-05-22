import { AppSettingsType, SettingsPayload } from '@/constants/Types';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, TextInput } from 'react-native';
import { useSalesInfo } from './context/SalesInfoContext';

type Props = {
  onCloseModal: () => void;
  setModalType: (value: 'controller' | 'users-list' | null) => void;
  isVisible: boolean;
};

export default function Controller({ onCloseModal, setModalType, isVisible }: Props) {
  const { refresh: refreshSalesData } = useSalesInfo();
  const [summerSale, setSummerSale] = useState(false);
  const [blackFriday, setBlackFriday] = useState(false);
  const [promoActive, setPromoActive] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState('');

  // УТИЛИТАРНАЯ ФУНКЦИЯ ДЛЯ PATCH ЗАПРОСА
  const patchSetting = async (payload: SettingsPayload) => {
    try {
      await axios.patch('https://dcc2e55f63f7f47b.mokky.dev/app-settings/1', payload);
    } catch (err) {
      console.error('ОШИБКА ПРИ СОХРАНЕНИИ НАСТРОЕК', err);
      alert('Не удалось сохранить изменения');
    }
  };

  // ЛЕТНЯЯ РАСПРОДАЖА: включить, выключив остальное
  const onToggleSummerSale = async (value: boolean) => {
    const newSummer = value;
    setSummerSale(newSummer);
    setBlackFriday(false);
    setPromoActive(false);
    setPromoDiscount('');

    await patchSetting({
      summer_sale: newSummer,
      black_friday: false,
      sale: false,
      sale_discount: 0,
    });
    refreshSalesData();
  };

  // ЧЁРНАЯ ПЯТНИЦА: включить, выключив остальное
  const onToggleBlackFriday = async (value: boolean) => {
    const newBlack = value;
    setBlackFriday(newBlack);
    setSummerSale(false);
    setPromoActive(false);
    setPromoDiscount('');

    await patchSetting({
      summer_sale: false,
      black_friday: newBlack,
      sale: false,
      sale_discount: 0,
    });
    refreshSalesData();
  };

  // ГЛОБАЛЬНАЯ АКЦИЯ: только локально открыть input, без запроса
  const onTogglePromoActive = (value: boolean) => {
    setPromoActive(value);

    if (!value) {
      setPromoDiscount('');
    }
  };

  // ОБРАБОТКА ВВОДА СКИДКИ
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

  // ЗАПУСК ГЛОБАЛЬНОЙ АКЦИИ: отправка запроса и сброс остальных
  const handleStartPromo = async () => {
    if (!promoDiscount) {
      alert('Введите скидку');
      return;
    }

    await patchSetting({
      summer_sale: false,
      black_friday: false,
      sale: true,
      sale_discount: Number(promoDiscount),
    });
    refreshSalesData();

    onCloseModal();
    setModalType(null);
  };

  // ЗАГРУЗКА НАСТРОЕК ПРИ ОТКРЫТИИ МОДАЛА
  const fetchData = async () => {
    try {
      const { data } = await axios.get<AppSettingsType>(
        'https://dcc2e55f63f7f47b.mokky.dev/app-settings/1',
      );
      setSummerSale(data.summer_sale);
      setBlackFriday(data.black_friday);
      setPromoActive(data.sale);
      setPromoDiscount(
        data.sale_discount && data.sale_discount > 0 ? data.sale_discount.toString() : '',
      );
    } catch (err) {
      console.error('НЕ УДАЛОСЬ ЗАГРУЗИТЬ ДАННЫЕ', err);
    }
  };

  useEffect(() => {
    if (isVisible) fetchData();
  }, [isVisible]);

  return (
    <View className="p-4 bg-white rounded-2xl">
      <Text className="text-2xl font-semibold text-gray-800 mb-6">Настройки приложения</Text>

      {/* СЕЗОННЫЕ ПРЕДЛОЖЕНИЯ */}
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

      {/* ГЛОБАЛЬНАЯ АКЦИЯ */}
      <View className="mb-6">
        <Text className="text-[16px] font-medium text-gray-800">Глобальная акция</Text>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-base text-gray-700">Устроить акцию</Text>
          <Switch
            value={promoActive}
            onValueChange={onTogglePromoActive}
            trackColor={{ false: '#ccc', true: '#9DD458' }}
            thumbColor="#fff"
            disabled={false}
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

      {/* КНОПКИ */}
      <View className="flex-row justify-end space-x-4">
        <TouchableOpacity
          onPress={() => {
            onCloseModal();
            setModalType(null);
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
