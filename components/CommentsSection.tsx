import { useGetUser } from '@/hooks/useGetUser';
import AntDesign from '@expo/vector-icons/AntDesign';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import StarRating from 'react-native-star-rating-widget';
import Toast from 'react-native-toast-message';

type Comment = {
  id: number;
  user_id: number;
  text: string;
  created_at: string;
  stars: number;
};

type User = {
  id: number;
  name: string;
  lastName: string;
  avatarUri: string;
};

type Props = {
  items: Comment[];
  productId: number;
  onNewComment: (c: Comment) => void;
  onDeleteComment: (id: number) => void;
  onEditComment: (id: number, editedText: string, editedStars: number) => void;
};

export default function CommentsSection({
  productId,
  items,
  onNewComment,
  onDeleteComment,
  onEditComment,
}: Props) {
  const [usersMap, setUsersMap] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { user } = useGetUser({});

  const sortedItems = [...items].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ОПРЕДЕЛЯЕМ, КАКИЕ ОТЗЫВЫ ПОКАЗЫВАТЬ
  const displayItems = expanded ? sortedItems : sortedItems.slice(0, 5);

  // для создания отзыва
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  // СОЗДАЕМ STATE ДЛЯ МОДАЛИ И ВЫБРАННОГО ОТЗЫВА
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedStars, setEditedStars] = useState(0);

  // ФУНКЦИЯ ОТКРЫТИЯ МОДАЛИ ДЛЯ РЕДАКТИРОВАНИЯ
  const openEditModal = (item: Comment) => {
    setSelectedComment(item);
    setEditedText(item.text);
    setEditedStars(item.stars);
    setModalVisible(true);
  };

  // ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ ИЗМЕНЕНИЯ ОТЗЫВА
  const submitEdit = async () => {
    if (!selectedComment) return;
    try {
      const { data } = await axios.get<{ comments: Comment[] }>(
        `https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`,
      );
      const updated = data.comments.map((c) =>
        c.id === selectedComment.id ? { ...c, text: editedText.trim(), stars: editedStars } : c,
      );
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`, {
        comments: updated,
      });
      Toast.show({ type: 'success', text1: 'REVIEW UPDATED' });
      onEditComment(selectedComment.id, editedText.trim(), editedStars);
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('ERROR', 'FAILED TO UPDATE THE REVIEW');
    }
  };

  // REVIEW DELETE CONFIRM FUNCTION
  const sumbitDelete = (id: number) => {
    Alert.alert('Delete review', 'Are you sure you want to delete this review?', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'DELETE',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await axios.get<{ comments: Comment[] }>(
              `https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`,
            );
            const filtered = data.comments.filter((c) => c.id !== id);
            await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`, {
              comments: filtered,
            });
            Toast.show({ type: 'success', text1: 'REVIEW DELETED' });
            onDeleteComment(id);
          } catch (e) {
            console.error(e);
            Alert.alert('ERROR', 'FAILED TO DELETE THE REVIEW');
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to leave a review.');
      return;
    }

    if (comment.trim().length === 0) {
      Alert.alert('Error', 'Please enter your review text.');
      return;
    }

    // Build the new comment object
    const newComment: Comment = {
      id: Date.now(), // Temporary unique ID
      user_id: user ? user.id : 0, // From useGetUser
      text: comment.trim(),
      stars: rating,
      created_at: new Date().toISOString(),
    };

    try {
      // 1) Get current comments
      const { data } = await axios.get<{ comments: Comment[] }>(
        `https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`,
      );
      const existingComments = data.comments || [];

      // 2) Create the updated array
      const updatedComments = [...existingComments, newComment];

      // 3) Send PATCH to replace the comments field
      await axios.patch(`https://dcc2e55f63f7f47b.mokky.dev/products/${productId}`, {
        comments: updatedComments,
      });

      // 4) Update daily/weekly progress for reviews
      try {
        const [dailyRes, weeklyRes] = await Promise.all([
          axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/1'), // daily
          axios.get('https://dcc2e55f63f7f47b.mokky.dev/tasks/2'), // weekly
        ]);

        const daily = dailyRes.data;
        const weekly = weeklyRes.data;

        const currentDailyReviews = Number(daily?.make_review ?? 0);
        const currentWeeklyReviews = Number(weekly?.make_5_review ?? 0);

        const requests: Promise<any>[] = [];

        // DAILY: make_review (max 1)
        if (currentDailyReviews < 1) {
          requests.push(
            axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/1', {
              make_review: currentDailyReviews + 1,
            }),
          );
        }

        // WEEKLY: make_5_review (max 5)
        if (currentWeeklyReviews < 5) {
          requests.push(
            axios.patch('https://dcc2e55f63f7f47b.mokky.dev/tasks/2', {
              make_5_review: currentWeeklyReviews + 1,
            }),
          );
        }

        if (requests.length > 0) {
          await Promise.all(requests);
        }
      } catch (err) {
        console.error('Error updating review progress:', err);
      }

      // 5) Notify the user
      Toast.show({
        type: 'success',
        text1: 'Thank you',
        text2: 'Your review has been submitted successfully',
        visibilityTime: 3000,
      });

      // 6) Notify the parent so it can add the comment to its state
      onNewComment(newComment);

      // 7) Clear the form
      setComment('');
      setRating(0);
    } catch (err) {
      console.error('Error while creating a review:', err);
      // You can show an Alert or Toast here
    }
  };

  // СОБИРАЕМ УНИКАЛЬНЫЕ ID
  useEffect(() => {
    const uniqueIds = Array.from(new Set(items.map((c) => c.user_id)));
    Promise.all(
      uniqueIds.map((id) =>
        fetch(`https://dcc2e55f63f7f47b.mokky.dev/users/${id}`)
          .then((res) => res.json())
          .then((user: User) => [id, user] as [number, User]),
      ),
    )
      .then((pairs) => {
        const map: Record<number, User> = {};
        pairs.forEach(([id, user]) => {
          map[id] = user;
        });
        setUsersMap(map);
      })
      .finally(() => setLoading(false));
  }, [items]);

  // WHILE LOADING — SPINNER
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // РЕНДЕР ОДНОГО ОТЗЫВА
  const renderItem = ({ item }: { item: Comment }) => {
    const itemUser = usersMap[item.user_id];
    return (
      <View className="flex-row bg-white p-4 rounded-2xl shadow mb-4">
        <Image source={{ uri: itemUser.avatarUri }} className="w-12 h-12 rounded-full mr-4" />
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold">
              {itemUser.name} {itemUser.lastName}
            </Text>
            <Text className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Text className="mt-2 text-sm text-gray-700">{item.text}</Text>
          <View className="mt-2">
            <StarRatingDisplay style={{ marginLeft: -5 }} rating={item.stars} starSize={20} />
          </View>

          {/* EDIT AND DELETE BUTTONS FOR THE AUTHOR */}
          {user?.id === item.user_id && (
            <>
              <View className="mt-2 flex-row justify-end space-x-4">
                <TouchableOpacity onPress={() => openEditModal(item)} className="mr-4">
                  <AntDesign name="edit" size={21} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sumbitDelete(item.id)}>
                  <AntDesign name="delete" size={21} color="red" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="p-4 bg-white rounded-2xl shadow mb-[25px]">
          {/* FORM TITLE */}
          <View className="mb-4">
            <Text className="text-xl font-semibold">Write a review</Text>
          </View>

          {/* REVIEW TEXT FIELD */}
          <View className="mb-4">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Your review..."
              multiline
              className="border border-gray-300 rounded-lg p-3 h-24 text-base"
            />
          </View>

          {/* RATING SELECTION */}
          <View className="mb-4">
            <StarRating rating={rating} onChange={setRating} starSize={30} />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-blue-500 py-3 rounded-full items-center">
            <Text className="text-white text-base font-medium">Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <Text className="text-2xl font-bold mb-4">User Reviews</Text>
        <Text className="text-lg font-semibold mb-4">{items.length} reviews</Text>
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />

        {/* SHOW ALL / HIDE BUTTON */}
        {items.length > 5 && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            className="mt-4 py-2 px-6 bg-blue-500 rounded-full self-center">
            <Text className="text-white text-base">{expanded ? 'Hide' : 'Show all'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ РЕДАКТИРОВАНИЯ */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          className="flex-1 justify-center items-center bg-opacity-50">
          <View className="bg-white p-6 rounded-2xl w-11/12">
            <Text className="text-xl font-semibold mb-4">EDIT REVIEW</Text>
            <TextInput
              value={editedText}
              onChangeText={setEditedText}
              placeholder="REVIEW TEXT"
              multiline
              className="border border-gray-300 rounded-lg p-3 h-24 text-base mb-4"
            />
            <StarRating rating={editedStars} onChange={setEditedStars} starSize={30} />
            <View className="flex-row justify-end mt-6">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4">
                <Text className="text-gray-500">CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitEdit}>
                <Text className="text-blue-500">SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
