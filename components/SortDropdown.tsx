import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, FlatList } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

const SORT_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'men', label: "Men's" },
  { key: 'woman', label: "Women's" },
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
    // relative container so the dropdown is positioned relative to it
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
          {SORT_OPTIONS.find((o) => o.key === selectedKey)?.label || 'Sort by'}
        </Text>
        <AntDesign name={open ? 'up' : 'down'} size={16} color="black" />
      </TouchableOpacity>

      {/* Absolutely positioned container */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 50, // slightly below the button (45px + 5px spacing)
          left: 0,
          right: 0,
          height: animation,
          overflow: 'hidden',
          backgroundColor: '#fff',
          borderWidth: open ? 1 : 0,
          borderColor: '#e6e6e6',
          borderRadius: 10,
          zIndex: 20, // so it's above everything else
        }}>
        <FlatList data={SORT_OPTIONS} keyExtractor={(item) => item.key} renderItem={renderOption} />
      </Animated.View>
    </View>
  );
};

export default SortDropdown;
