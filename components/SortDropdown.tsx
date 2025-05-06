import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, FlatList } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

const SORT_OPTIONS = [
  { key: 'all', label: 'Все' },
  { key: 'price_asc', label: 'Цена: по возрастанию' },
  { key: 'price_desc', label: 'Цена: по убыванию' },
  { key: 'men', label: 'Мужские' },
  { key: 'woman', label: 'Женские' },
];

const SortDropdown: React.FC<{
  selectedKey: string;
  onSelectSort: (key: string) => void;
}> = ({ selectedKey, onSelectSort }) => {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: open ? SORT_OPTIONS.length * 40 : 0,
      duration: 300,
      easing: Easing.out(Easing.circle),
      useNativeDriver: false,
    }).start();
  }, [open]);

  const toggleMenu = () => setOpen((prev) => !prev);

  const renderOption = ({ item }: { item: { key: string; label: string } }) => (
    <TouchableOpacity
      style={{
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 15,
        backgroundColor: item.key === selectedKey ? '#eef6fb' : '#fff',
      }}
      onPress={() => {
        onSelectSort(item.key);
        setOpen(false);
      }}>
      <Text style={{ fontSize: 14, color: '#333' }}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    // relative-контейнер, чтобы потом выпадашка позиционировалась относительно него
    <View style={{ marginBottom: 25, zIndex: 10, position: 'relative' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleMenu}
        style={{
          height: 45,
          backgroundColor: '#fff',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#e6e6e6',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 15,
        }}>
        <Text style={{ fontSize: 14, color: '#000' }}>
          {SORT_OPTIONS.find((o) => o.key === selectedKey)?.label || 'Сортировать'}
        </Text>
        <AntDesign name={open ? 'up' : 'down'} size={16} color="black" />
      </TouchableOpacity>

      {/* Абсолютно позиционированный контейнер */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 50, // чуть ниже кнопки (45px + 5px отступ)
          left: 0,
          right: 0,
          height: animation,
          overflow: 'hidden',
          backgroundColor: '#fff',
          borderWidth: open ? 1 : 0,
          borderColor: '#e6e6e6',
          borderRadius: 10,
          zIndex: 20, // чтобы был над остальным
        }}>
        <FlatList data={SORT_OPTIONS} keyExtractor={(item) => item.key} renderItem={renderOption} />
      </Animated.View>
    </View>
  );
};

export default SortDropdown;
