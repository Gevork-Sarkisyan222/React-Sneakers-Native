import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { Pressable, TextInputChangeEventData } from 'react-native';
import { NativeSyntheticEvent, TextInput, View } from 'react-native';

type Props = {
  value: string;
  setValue: (text: string) => void;
  onChangeValue: (e: NativeSyntheticEvent<TextInputChangeEventData>) => void;
};
function SearchInput({ value, setValue, onChangeValue }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`w-full h-[45px] rounded-[10px] bg-white flex-row items-center px-[15px] mb-[15px] ${
        isFocused ? 'border-[#999999]' : 'border-[#e6e6e6]'
      } border-[1px]`}>
      <FontAwesome className="mr-[13px]" name="search" size={18} color="#E4E4E4" />
      <TextInput
        value={value}
        onChange={(e) => onChangeValue(e)}
        placeholder="Search sneakers..."
        placeholderTextColor="#767676"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 text-black"
      />

      {value && (
        <Pressable onPress={() => setValue('')}>
          <FontAwesome className="cursor-pointer" name="close" size={20} color="#C4C4C4" />
        </Pressable>
      )}
    </View>
  );
}

export default SearchInput;
