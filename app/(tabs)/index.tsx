import Header from '@/components/Header';
import ProductList from '@/components/ProductList';
import { Product } from '@/constants/Types';
import { setProducts } from '@/redux/slices/products.slice';
import { RootState } from '@/redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  type ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';

import { ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const INTRO_KEY = 'native_sneakers_intro_seen_v7';
const ROLE_KEY = 'native_sneakers_role_v1';

const BG = '#F6F3EE';
const TEXT_MAIN = '#1F2937';
const TEXT_MUTED = '#6B7280';
const DOT_INACTIVE = '#D1D5DB';
const PRIMARY = '#A6D36E';
const PRIMARY_TEXT = '#FFFFFF';

const { width: W } = Dimensions.get('window');

type Role = 'user' | 'admin' | 'superadmin';

type Slide = {
  key: string;
  title: string;
  desc: string;
  icon: string | ImageSourcePropType;
  badge?: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  tip?: string;
};

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 18 : 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: i === active ? PRIMARY : DOT_INACTIVE,
          }}
        />
      ))}
    </View>
  );
}

function IconCard({ icon }: { icon: Slide['icon'] }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 26 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {typeof icon === 'string' ? (
          <Text style={{ fontSize: 110 }}>{icon}</Text>
        ) : (
          <Image source={icon} style={{ width: 150, height: 150 }} resizeMode="contain" />
        )}
      </View>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View
      style={{
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#FFF7ED',
        borderColor: '#FED7AA',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}>
      <Text style={{ color: '#9A3412', fontWeight: '800', textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

type PrimaryButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  width?: DimensionValue;
  loadingText?: string;
};

function PrimaryButton({
  title,
  onPress,
  disabled,
  loading = false,
  width = '60%',
  loadingText = 'Создаём ваш аккаунт…',
}: PrimaryButtonProps) {
  const isDisabled = !!disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.9}
      style={{
        backgroundColor: isDisabled ? '#D1D5DB' : PRIMARY,
        width,
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.95 : 1,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%', // ✅ чтобы текст реально центрировался
          paddingHorizontal: 16, // ✅ чтобы не прилипал к краям
        }}>
        {loading ? <ActivityIndicator size="small" color={PRIMARY_TEXT} /> : null}

        <Text
          style={{
            color: PRIMARY_TEXT,
            fontWeight: '900',
            fontSize: 16,
            textAlign: 'center',
            flexShrink: 1, // ✅ чтобы переносилось красиво
          }}
          numberOfLines={2}>
          {loading ? loadingText : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function GhostButton({
  title,
  onPress,
  hidden,
}: {
  title: string;
  onPress: () => void;
  hidden?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{ paddingVertical: 10, paddingHorizontal: 10, opacity: hidden ? 0 : 1 }}
      disabled={hidden}>
      <Text style={{ color: TEXT_MAIN, fontWeight: '800' }}>{title}</Text>
    </TouchableOpacity>
  );
}

function RoleCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 2,
        borderColor: selected ? PRIMARY : '#EFECE6',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}>
      <Text style={{ color: TEXT_MAIN, fontWeight: '900', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: TEXT_MUTED, marginTop: 6, lineHeight: 18 }}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function OptionButton({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 2,
        borderColor: selected ? PRIMARY : '#EFECE6',
        marginTop: 10,
      }}>
      <Text style={{ color: TEXT_MAIN, fontWeight: '800' }}>{text}</Text>
    </TouchableOpacity>
  );
}

function GuideBullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
      <View
        style={{
          width: 8.5,
          height: 8.5,
          borderRadius: 999,
          marginTop: 7,
          backgroundColor: PRIMARY,
        }}
      />
      <Text style={{ flex: 1, color: TEXT_MUTED, lineHeight: 18 }}>{text}</Text>
    </View>
  );
}

function Intro({ onDone }: { onDone: (role: Role) => void }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [role, setRole] = useState<Role | null>(null);

  const isAdminLike = role === 'admin' || role === 'superadmin';
  const canCreate = isAdminLike ? firstName.trim().length > 0 && lastName.trim().length > 0 : true;

  // простая транслитерация RU → латиница (чтобы email был норм)
  const ruMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  const toLatin = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .split('')
      .map((ch) => ruMap[ch] ?? ch)
      .join('')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9._-]/g, '');

  const emailPreview = isAdminLike
    ? `${toLatin(firstName) || 'name'}.${toLatin(lastName) || 'lastname'}###@example.com`
    : '';

  type CreatePhase = 'idle' | 'create' | 'auth';
  const [createPhase, setCreatePhase] = useState<CreatePhase>('idle');

  type CreatedCreds = {
    name: string;
    lastName: string;
    email: string;
    password: string;
    avatarUri: string;
    position: 'admin' | 'superadmin';
    balance: number;

    role: 'admin' | 'superadmin';
    fullName: string;
  };

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<CreatedCreds | null>(null);

  const FIRST_NAMES = [
    'Alex',
    'David',
    'Mark',
    'Artem',
    'Nikita',
    'Timur',
    'Giorgi',
    'Levan',
    'Anna',
    'Nino',
    'Sofia',
    'Maria',
  ];
  const LAST_NAMES = [
    'Ivanov',
    'Petrov',
    'Smirnov',
    'Kuznetsov',
    'Volkov',
    'Sargsyan',
    'Melikyan',
    'Karapetyan',
    'Beridze',
    'Kiknadze',
    'Kalandadze',
    'Hakobyan',
  ];
  const STREETS = [
    'Ленина',
    'Пушкина',
    'Гагарина',
    'Тбилисская',
    'Садовая',
    'Мира',
    'Шота Руставели',
  ];
  const CITIES = [
    'Москва, Россия',
    'Тбилиси, Грузия',
    'Ереван, Армения',
    'Батуми, Грузия',
    'Санкт-Петербург, Россия',
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const makeEmail = (fn: string, ln: string, digits?: string) => {
    const a = toLatin(fn) || 'user';
    const b = toLatin(ln) || 'demo';
    const d = digits ?? String(Math.floor(100 + Math.random() * 900)); // 3 цифры
    return `${a}.${b}${d}@example.com`;
  };

  const makePassword = () => {
    const a = randInt(1000, 9999);
    const b = randInt(10, 99);
    return `NS${a}${b}A`; // простой, но нормальный пароль для демо
  };

  const makePhone = () => {
    const a = randInt(10, 99);
    const b = randInt(100, 999);
    const c = randInt(10, 99);
    const d = randInt(10, 99);
    return `+7 9${a} ${b} ${c} ${d}`;
  };

  const makeAddress = () => {
    const street = pick(STREETS);
    const house = randInt(1, 120);
    const city = pick(CITIES);
    return `ул. ${street}, д. ${house}, ${city}`;
  };

  const adminAvatar = 'https://i.pinimg.com/736x/34/60/3c/34603ce8a80b1ce9a768cad7ebf63c56.jpg';

  const superAdminAvatar = 'https://cdn-icons-png.flaticon.com/512/10841/10841598.png';

  const isDupEmail = (err: any) => {
    const status = err?.response?.status;
    const msg = String(err?.response?.data?.message ?? err?.message ?? '').toLowerCase();
    return status === 409 || msg.includes('email') || msg.includes('exists') || msg.includes('уже');
  };

  const createRoleAccount = async (role: 'admin' | 'superadmin') => {
    if (creating) return;

    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setCreateError('Введи имя и фамилию.');
      return;
    }

    setCreateError(null);
    setCreating(true);
    setCreatePhase('create');

    const avatarUri = role === 'admin' ? adminAvatar : superAdminAvatar;
    const balance = role === 'superadmin' ? 200000 : 100000;

    // пароль один раз (чтобы в кредах совпадал)
    const createdPassword = makePassword();

    try {
      // 1) создаём юзера (с ретраями если email занят)
      let createdEmail = '';
      let createdUserCreated = false;

      for (let attempt = 0; attempt < 6; attempt++) {
        createdEmail = makeEmail(first, last); // first.last123@example.com

        try {
          await axios.post('https://dcc2e55f63f7f47b.mokky.dev/users', {
            name: first,
            lastName: last,
            avatarUri,
            email: createdEmail,
            password: createdPassword,
            phone: makePhone(),
            address: makeAddress(),
            balance,
            position: role,
            isBlocked: false,
            banStart: null,
            banUntil: null,
            blockReason: null,
            blockedBy: null,
          });

          createdUserCreated = true;
          break;
        } catch (err: any) {
          // если email занят — пробуем другой
          if (isDupEmail(err) && attempt < 5) continue;
          throw err;
        }
      }

      if (!createdUserCreated) throw new Error('create_failed');

      // 2) логин + токен
      setCreatePhase('auth');

      const authRes = await axios.post('https://dcc2e55f63f7f47b.mokky.dev/auth', {
        email: createdEmail,
        password: createdPassword,
      });

      const { token } = authRes.data;

      await SecureStore.setItemAsync('userToken', token);

      // 3) показываем экран “Аккаунт готов”
      setCreatedCreds({
        name: first,
        lastName: last,
        email: createdEmail,
        password: createdPassword,
        avatarUri,
        position: role,
        balance,

        // если у тебя это поле используется где-то в UI
        role,
        fullName: `${first} ${last}`,
      });

      // ВАЖНО: не уходим на '/' — иначе ты НЕ увидишь credentials.
      setStage('credentials');
    } catch (e) {
      console.error(e);

      // не пиши “слишком долго” — просто норм ошибка
      setCreateError('Не получилось создать демо-аккаунт. Проверь интернет и попробуй ещё раз.');
    } finally {
      setCreating(false);
      setCreatePhase('idle');
    }
  };

  type Stage = 'slides' | 'role' | 'quiz' | 'guide' | 'setup' | 'credentials';

  const slides: Slide[] = useMemo(
    () => [
      {
        key: '1',
        icon: { uri: 'https://cdn-icons-png.flaticon.com/512/8771/8771926.png' },
        title: 'Native Sneakers',
        desc: 'Учебная симуляция магазина. Можно безопасно потренироваться: товары, карточки, избранное, корзина и “покупки” а также очень много функции. И взаимодействие с приложением.',
      },
      {
        key: '2',
        icon: { uri: 'https://cdn-icons-png.flaticon.com/512/18091/18091014.png' },
        title: 'Роли и практика',
        desc: 'Побудь пользователем, админом, главным админом или владельцем — чтобы понять права доступа и управление внутри приложения. Пройди практику здесь.',
      },
      {
        key: '3',
        icon: '🧠',
        title: 'Полезно новичкам и детям',
        desc: 'Это “тренажёр” интерфейсов: как работает корзина, баланс и действия пользователя. Подойдёт и как практика для модераторов/админов. Узнай как работает магазин изнутри.',
      },
      {
        key: '4',
        icon: '💳',
        title: 'Важно: всё тестовое',
        badge: 'ДЕМО • ПЛАТЕЖИ НЕ НАСТОЯЩИЕ',
        desc: 'Любые “покупки”, “пополнения”, суммы и “карты” — демо-симуляция. Можете создать аккаунт и пользоваться всеми возможностями. Почему бы не попробовать?',
      },
    ],
    [],
  );

  const adminQuiz: QuizQuestion[] = useMemo(
    () => [
      {
        id: 'a1',
        question: 'Что обычно делает Админ с товарами в админке?',
        options: [
          'Создаёт/редактирует товары и меняет их параметры',
          'Только покупает товары как обычный пользователь',
          'Не имеет доступа к товарам вообще',
        ],
        correctIndex: 0,
        tip: 'Админ управляет контентом магазина.',
      },
      {
        id: 'a2',
        question: 'Если товар временно нельзя показывать в магазине, что логичнее сделать?',
        options: ['Удалить навсегда', 'Скрыть/деактивировать товар', 'Поставить в избранное'],
        correctIndex: 1,
        tip: 'В реальных админках чаще “скрывают”, а не удаляют.',
      },
      {
        id: 'a3',
        question:
          'Пользователь написал плохой комментарий. Какой правильный порядок действий админа?',
        options: [
          'Сразу удалить всё подряд без проверки',
          'Проверить и удалить/скрыть по правилам + при необходимости ограничить',
          'Ответить “ок” и оставить как есть',
        ],
        correctIndex: 1,
        tip: 'Сначала проверка, потом действие по правилам.',
      },
      {
        id: 'a4',
        question: 'Что важно проверить после редактирования товара (цена/название/фото)?',
        options: [
          'Что изменения сохранились и отображаются в списке/карточке',
          'Что приложение стало “красивее”',
          'Что у админа повысился баланс',
        ],
        correctIndex: 0,
        tip: 'Админ всегда проверяет: сохранилось → отобразилось.',
      },
      {
        id: 'a5',
        question: 'Как админ обычно работает с заявками/жалобами?',
        options: [
          'Смотрит очередь, принимает решение и фиксирует результат',
          'Игнорирует, потому что это не его зона',
          'Отправляет всем пользователям уведомление “не пишите”',
        ],
        correctIndex: 0,
        tip: 'Очередь → решение → результат (логика большинства админок).',
      },
    ],
    [],
  );

  const superAdminQuiz: QuizQuestion[] = useMemo(
    () => [
      {
        id: 's1',
        question: 'В чём главная разница Супер Админа от Админа?',
        options: [
          'Супер Админ управляет ролями/правами и системными настройками',
          'Супер Админ просто быстрее листает товары',
          'Разницы нет вообще',
        ],
        correctIndex: 0,
        tip: 'Супер Админ управляет доступами и правилами.',
      },
      {
        id: 's2',
        question: 'Нужно выдать доступ новому админу. Как правильно?',
        options: [
          'Выдать максимум прав сразу',
          'Выдать только нужные права под задачи и при необходимости расширять',
          'Не выдавать доступ никому',
        ],
        correctIndex: 1,
        tip: 'Лучше выдавать минимум нужного и расширять по мере надобности.',
      },
      {
        id: 's3',
        question:
          'Пользователь жалуется: “у меня пропал доступ к админке”. Что проверить первым делом?',
        options: [
          'Его роль/позицию и разрешения',
          'Цвет темы в приложении',
          'Количество товаров в каталоге',
        ],
        correctIndex: 0,
        tip: 'Сначала права доступа: роль → разрешения.',
      },
      {
        id: 's4',
        question:
          'Если админ случайно удаляет важные данные, какой “правильный” подход в реальных системах?',
        options: [
          'Никакой — удалить значит удалить',
          'Использовать “мягкое удаление”/восстановление или историю изменений',
          'Попросить пользователя не жаловаться',
        ],
        correctIndex: 1,
        tip: 'В реальных админках часто есть восстановление/история.',
      },
      {
        id: 's5',
        question:
          'Если админ случайно выдал пользователю статус “Admin”, что должен сделать супер-админ?',
        options: [
          'Вернуть правильную роль/статус и сохранить изменения',
          'Оставить как есть, чтобы “не трогать” систему',
          'Удалить аккаунт пользователя',
        ],
        correctIndex: 0,
        tip: 'Супер-админ отвечает за корректные роли и доступы.',
      },
    ],
    [],
  );

  const [stage, setStage] = useState<Stage>('slides');
  const [slideIndex, setSlideIndex] = useState(0);

  const listRef = useRef<FlatList<Slide> | null>(null);
  const isLastSlide = slideIndex === slides.length - 1;

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / W);
    setSlideIndex(newIndex);
  }, []);

  const goToSlide = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setSlideIndex(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [slides.length],
  );

  // Запрещаем Android Back во время интро (чтобы нельзя было “пропустить”)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // const totalSteps = useMemo(() => {
  //   if (stage === 'slides') return 5; // 4 слайда + выбор роли
  //   if (!role) return 5;
  //   if (role === 'user') return 6; // + guide
  //   return 7; // + quiz + guide
  // }, [stage, role]);

  const totalSteps = useMemo(() => {
    // 4 слайда + выбор роли = 5
    if (!role) return 5;

    // user: guide и дальше в логин
    if (role === 'user') return 6;

    // admin/superadmin: quiz + guide + setup + credentials
    return 9;
  }, [role]);

  const currentStep = useMemo(() => {
    if (stage === 'slides') return slideIndex + 1; // 1..4
    if (stage === 'role') return 5;
    if (stage === 'quiz') return 6;

    if (stage === 'guide') return role === 'user' ? 6 : 7;
    if (stage === 'setup') return 8;
    if (stage === 'credentials') return 9;

    return 1;
  }, [stage, slideIndex, role]);

  const goNextFromSlides = useCallback(() => {
    if (!isLastSlide) {
      goToSlide(slideIndex + 1);
      return;
    }
    setStage('role');
  }, [isLastSlide, goToSlide, slideIndex]);

  const quiz = useMemo(() => {
    if (role === 'admin') return adminQuiz;
    if (role === 'superadmin') return superAdminQuiz;
    return [];
  }, [role, adminQuiz, superAdminQuiz]);

  const resetQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizScore(null);
  }, []);

  const startTraining = useCallback(() => {
    if (!role) return;
    if (role === 'user') {
      setStage('guide');
      return;
    }
    resetQuiz();
    setStage('quiz');
  }, [role, resetQuiz]);

  const finishQuiz = useCallback(() => {
    const q = quiz;
    let score = 0;
    for (const item of q) {
      if (quizAnswers[item.id] === item.correctIndex) score += 1;
    }
    setQuizScore(score);
    setStage('guide');
  }, [quiz, quizAnswers]);

  const finishAll = useCallback(() => {
    if (!role) return;
    onDone(role);
  }, [onDone, role]);

  const guideTitle = useMemo(() => {
    if (role === 'admin') return 'Гайд для Админа';
    if (role === 'superadmin') return 'Гайд для Супер Админа';
    return 'Гайд для Пользователя';
  }, [role]);

  const guideBullets = useMemo(() => {
    if (role === 'admin') {
      return [
        'Зайди в админку и посмотри, какие разделы доступны твоей роли.',
        'Потренируйся управлять контентом: добавление/редактирование данных (всё в тестовой базе).',
        'Модерация: смотри комментарии/жалобы и учись принимать решения по правилам.',
        'Ознакомиться со всеми функциями ты можешь в админ-панели.',
      ];
    }

    if (role === 'superadmin') {
      return [
        'Посмотри управление ролями/правами: кому и что разрешено.',
        'Следи за порядком: проверяй спорные действия и принимай решения аккуратно.',
        'Тренируй “least privilege”: выдавай только нужные права, чтобы меньше ошибок.',
        'Проверяй логику модерации и админ-процессов на тестовых данных.',
        'Устрайвать акции/скидки или закрыть магазин во время разработки — это твое дело.',
        'Ознакомиться со всеми функциями ты можешь в админ-панели.',
      ];
    }

    return [
      'Смотри товары, открывай карточки и изучай интерфейс магазина.',
      'Добавляй в избранное и собирай свою “витрину” понравившихся вещей.',
      'Симулируй покупки/действия — это обучение, никаких реальных оплат нет не бойся.',
      'Если видишь баланс/пополнение — это демо. Не вводи настоящие данные просто вводи какие то цифры чтобы система засчитала и сумму которую ты хочешь.',
      'Покупай кейсы и получай бонусы.',
      'Выполняй квесты и получай новые бонусы и твои полученные бонусы все будут в корзине.',
      'Когда освоишься — можешь перейти в приложение и просто пользоваться там много чего.',
    ];
  }, [role]);

  const CARD: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Native Sneakers by Gevork Sarkisyan</Text>
        <Text style={{ marginTop: 6, color: TEXT_MUTED, fontSize: 12 }}>
          Шаг {currentStep} из {totalSteps}
        </Text>
      </View>

      {/* STAGE: SLIDES */}
      {stage === 'slides' && (
        <>
          <FlatList
            ref={(r) => (listRef.current = r) as any}
            data={slides}
            keyExtractor={(item) => item.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            renderItem={({ item }) => (
              <View style={{ width: W, paddingHorizontal: 22, paddingTop: 18, flex: 1 }}>
                <IconCard icon={item.icon} />

                <View style={{ marginTop: 26, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: TEXT_MAIN,
                      fontSize: 22,
                      fontWeight: '800',
                      textAlign: 'center',
                    }}>
                    {item.title}
                  </Text>

                  {!!item.badge && <Chip text={item.badge} />}

                  <Text
                    style={{
                      color: TEXT_MUTED,
                      fontSize: 13,
                      textAlign: 'center',
                      marginTop: 12,
                      lineHeight: 18,
                      paddingHorizontal: 8,
                    }}>
                    {item.desc}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={{ paddingHorizontal: 22, paddingBottom: 18 }}>
            <Dots count={slides.length} active={slideIndex} />

            <Text
              style={{
                marginTop: 10,
                color: TEXT_MUTED,
                fontSize: 11,
                textAlign: 'center',
                lineHeight: 15,
              }}>
              Учебная симуляция • данные тестовые • реальные платежи не выполняются
            </Text>

            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton
                title="Назад"
                onPress={() => goToSlide(slideIndex - 1)}
                hidden={slideIndex === 0}
              />

              <PrimaryButton title={isLastSlide ? 'Далее' : 'Далее'} onPress={goNextFromSlides} />

              <View style={{ width: 56 }} />
            </View>
          </View>
        </>
      )}

      {/* STAGE: ROLE PICK */}
      {stage === 'role' && (
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 18 }}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text
              style={{ color: TEXT_MAIN, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              Кем ты хочешь быть?
            </Text>
            <Text style={{ color: TEXT_MUTED, marginTop: 10, textAlign: 'center', lineHeight: 18 }}>
              Выбор роли влияет на обучение. Для Admin/Super Admin будет небольшой тест и отдельный
              гайд.
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <RoleCard
              title="Пользователь"
              subtitle="Смотри товары, избранное, корзина и демо-покупки. Без управления админкой."
              selected={role === 'user'}
              onPress={() => setRole('user')}
            />
            <RoleCard
              title="Админ"
              subtitle="Практика управления контентом и модерации. Доступ к админ-функциям."
              selected={role === 'admin'}
              onPress={() => setRole('admin')}
            />
            <RoleCard
              title="Супер Админ"
              subtitle="Роли/права, контроль процессов и более широкий доступ."
              selected={role === 'superadmin'}
              onPress={() => setRole('superadmin')}
            />
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 18 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, textAlign: 'center', lineHeight: 15 }}>
              Не вводите настоящие пароли/банковские данные. Это обучение.
            </Text>

            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton title="Назад" onPress={() => setStage('slides')} />
              <PrimaryButton title="Продолжить" onPress={startTraining} disabled={!role} />
              <View style={{ width: 56 }} />
            </View>
          </View>
        </View>
      )}

      {/* STAGE: QUIZ */}
      {stage === 'quiz' && role && role !== 'user' && (
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 18 }}>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Text
              style={{ color: TEXT_MAIN, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              Мини-тест: {role === 'admin' ? 'Админ' : 'Супер Админ'}
            </Text>
            <Text style={{ color: TEXT_MUTED, marginTop: 8 }}>
              Вопрос {quizIndex + 1} из {quiz.length}
            </Text>
          </View>

          <View
            style={{
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#EFECE6',
            }}>
            <Text style={{ color: TEXT_MAIN, fontWeight: '900', fontSize: 16, lineHeight: 22 }}>
              {quiz[quizIndex].question}
            </Text>

            {!!quiz[quizIndex].tip && (
              <Text style={{ color: TEXT_MUTED, marginTop: 8, lineHeight: 18 }}>
                Подсказка: {quiz[quizIndex].tip}
              </Text>
            )}

            <View style={{ marginTop: 8 }}>
              {quiz[quizIndex].options.map((opt, idx) => (
                <OptionButton
                  key={idx}
                  text={opt}
                  selected={quizAnswers[quiz[quizIndex].id] === idx}
                  onPress={() =>
                    setQuizAnswers((prev) => ({
                      ...prev,
                      [quiz[quizIndex].id]: idx,
                    }))
                  }
                />
              ))}
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton
                title="Назад"
                onPress={() => {
                  if (quizIndex === 0) setStage('role');
                  else setQuizIndex((v) => Math.max(0, v - 1));
                }}
              />

              <PrimaryButton
                width="60%"
                title={quizIndex === quiz.length - 1 ? 'Завершить' : 'Далее'}
                disabled={quizAnswers[quiz[quizIndex].id] === undefined}
                onPress={() => {
                  if (quizIndex === quiz.length - 1) finishQuiz();
                  else setQuizIndex((v) => v + 1);
                }}
              />

              <View style={{ width: 56 }} />
            </View>
          </View>
        </View>
      )}

      {/* STAGE: GUIDE */}
      {stage === 'guide' && role && (
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 18 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Text
              style={{ color: TEXT_MAIN, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              {guideTitle}
            </Text>

            {role !== 'user' && quizScore !== null ? (
              <Text style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center' }}>
                Результат теста: {quizScore}/{quiz.length} (это просто обучение)
              </Text>
            ) : (
              <Text
                style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                Вот короткий план “как в игре”: что попробовать прямо сейчас, чтобы быстро
                освоиться.
              </Text>
            )}
          </View>

          {/* ✅ ВОТ ТУТ И ДОЛЖНА БЫТЬ “ОБУЧАЛКА” */}
          <View style={{ ...CARD, marginTop: 12 }}>
            {guideBullets.map((t, idx) => (
              <GuideBullet key={`${idx}-${t}`} text={t} />
            ))}

            <View style={{ marginTop: 14 }}>
              <Chip text="ДЕМО • ПЛАТЕЖИ НЕ НАСТОЯЩИЕ" />
              <Text
                style={{ color: TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginTop: 10 }}>
                Всё, что ты вводишь и делаешь — только в тестовой базе. Не используй реальные
                данные.
              </Text>
            </View>
          </View>

          {role === 'user' && (
            <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
              Для роли “Пользователь” аккаунт создаётся вручную. Нажми ниже и зарегистрируйся на
              экране входа.
            </Text>
          )}

          <View style={{ flex: 1 }} />

          {/* Bottom actions */}
          <View style={{ paddingBottom: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton
                title="Назад"
                onPress={() => {
                  if (role === 'user') setStage('role');
                  else setStage('quiz');
                }}
              />

              {role === 'user' ? (
                <PrimaryButton
                  width="60%"
                  title="Перейти к входу"
                  onPress={() => {
                    onDone(role);
                    router.replace('/login');
                  }}
                />
              ) : (
                <PrimaryButton
                  title={role === 'admin' ? 'Получить админку' : 'Получить супер-админку'}
                  onPress={() => setStage('setup')} // ✅ теперь это отдельный шаг
                />
              )}

              <View style={{ width: 56 }} />
            </View>
          </View>
        </View>
      )}

      {/* STAGE: SETUP (ввод имени/фамилии перед созданием) */}
      {stage === 'setup' && role && role !== 'user' && (
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 18 }}>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Text
              style={{ color: TEXT_MAIN, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              {role === 'admin' ? 'Получение админки' : 'Получение супер-админки'}
            </Text>
            <Text style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
              Введи имя и фамилию — мы соберём email, создадим тестовый аккаунт и сразу авторизуем
              тебя.
            </Text>
          </View>

          <View style={{ ...CARD, marginTop: 12 }}>
            <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '800' }}>
              Введите ваши данные
            </Text>

            <Text style={{ color: TEXT_MAIN, marginTop: 12, marginBottom: 6, fontWeight: '700' }}>
              Имя
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Введите ваше имя"
              autoCapitalize="words"
              style={{
                height: 46,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingHorizontal: 14,
                backgroundColor: '#FFFFFF',
                fontSize: 15,
                color: TEXT_MAIN,
              }}
            />

            <Text style={{ color: TEXT_MAIN, marginTop: 12, marginBottom: 6, fontWeight: '700' }}>
              Фамилия
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Введите вашу фамилию"
              autoCapitalize="words"
              style={{
                height: 46,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingHorizontal: 14,
                backgroundColor: '#FFFFFF',
                fontSize: 15,
                color: TEXT_MAIN,
              }}
            />

            <Text style={{ color: TEXT_MUTED, marginTop: 10 }}>
              Email будет примерно:{' '}
              <Text style={{ color: TEXT_MAIN, fontWeight: '800' }}>{emailPreview}</Text>
            </Text>

            <Text style={{ color: TEXT_MUTED, marginTop: 10, lineHeight: 18 }}>
              📸 После создания сделай скриншот экрана с данными (на всякий случай).
            </Text>
          </View>

          {createError ? (
            <Text style={{ color: '#B91C1C', textAlign: 'center', marginTop: 10 }}>
              {createError}
            </Text>
          ) : null}

          {creating ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 90,
              }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={{ color: TEXT_MAIN, marginTop: 12, fontWeight: '900', fontSize: 16 }}>
                {role === 'admin' ? 'Готовим админ-аккаунт…' : 'Готовим супер-админ аккаунт…'}
              </Text>
              <Text
                style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                {createPhase === 'create'
                  ? 'Шаг 1/2: создаём профиль в тестовой базе.'
                  : 'Шаг 2/2: выполняем вход и сохраняем токен.'}
                {'\n'}Обычно это занимает несколько минут или дольше пожалуйста подождите, можете
                пока поставить телефон на паузу и спокойно сделать чай — мы всё доделаем.
                Пожалуйста, не закрывайте приложение.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={{ paddingBottom: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton title="Назад" onPress={() => setStage('guide')} hidden={creating} />

              <PrimaryButton
                title={role === 'admin' ? 'Создать админ-аккаунт' : 'Создать супер-админ аккаунт'}
                onPress={() => createRoleAccount(role)}
                disabled={creating || !canCreate}
                loading={createPhase !== 'idle'}
                loadingText={'Создаём аккаунт…'}
                width="60%"
              />

              <View style={{ width: 56 }} />
            </View>
          </View>
        </View>
      )}

      {stage === 'credentials' && createdCreds && (
        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 18 }}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Image
              source={{ uri: createdCreds.avatarUri }}
              style={{ width: 96, height: 96, borderRadius: 999 }}
            />
            <Text style={{ color: TEXT_MAIN, fontSize: 26, fontWeight: '900', marginTop: 12 }}>
              Аккаунт готов ✅
            </Text>

            <Text style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
              Это ваш тестовый аккаунт: {createdCreds.position.toUpperCase()}. 📸 Обязательно
              сделайте скриншот этого экрана (Email/Пароль), чтобы не потерять данные.
            </Text>
          </View>

          <View
            style={{
              marginTop: 18,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#EFECE6',
            }}>
            <Text style={{ color: TEXT_MUTED, fontWeight: '800' }}>Email</Text>
            <View
              style={{
                marginTop: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#EFECE6',
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
              <Text style={{ color: TEXT_MAIN, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                {createdCreds.email}
              </Text>
              <TouchableOpacity
                onPress={() => Clipboard.setStringAsync(createdCreds.email)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}>
                <Text style={{ fontWeight: '900', color: TEXT_MAIN }}>Копировать</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: TEXT_MUTED, fontWeight: '800', marginTop: 14 }}>Пароль</Text>
            <View
              style={{
                marginTop: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#EFECE6',
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
              <Text style={{ color: TEXT_MAIN, fontWeight: '900', flex: 1 }} numberOfLines={1}>
                {createdCreds.password}
              </Text>
              <TouchableOpacity
                onPress={() => Clipboard.setStringAsync(createdCreds.password)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}>
                <Text style={{ fontWeight: '900', color: TEXT_MAIN }}>Копировать</Text>
              </TouchableOpacity>
            </View>

            {/* <View style={{ marginTop: 14 }}>
              <Chip text="ДЕМО • ПЛАТЕЖИ НЕ НАСТОЯЩИЕ" />
            </View> */}

            <Text style={{ color: TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginTop: 15 }}>
              Баланс: {createdCreds.balance.toLocaleString()} ₽ • роль: {createdCreds.position}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 18, display: 'flex', alignItems: 'center' }}>
            <PrimaryButton
              title="Перейти на главную"
              onPress={async () => {
                if (!role) return;
                await onDone(role as any);
              }}
            />

            <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
              Ты уже авторизован ✅ Данные выше — просто “резерв”, если захочешь войти вручную.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function Index() {
  const products = useSelector((state: RootState) => state.products.products);
  const updateProducts = useSelector((state: RootState) => state.products.updateProductsEffect);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [introChecked, setIntroChecked] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // нормальный shuffle (без sort random)
  const shuffleArray = useCallback((arr: Product[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  //  old
  const fetchProducts = useCallback(async () => {
    const res = await axios.get<Product[]>(
      'https://dcc2e55f63f7f47b.mokky.dev/products?_select=-description,-comments',
    );
    dispatch(setProducts(shuffleArray(res.data)));
  }, [dispatch, shuffleArray]);

  // new
  // const fetchProducts = useCallback(async () => {
  //   const res = await axios.get<Product[]>(
  //     'https://dcc2e55f63f7f47b.mokky.dev/products?_select=-description,-comments',
  //     { timeout: 20000 }, // 20s
  //   );

  //   dispatch(setProducts(shuffleArray(res.data)));
  // }, [dispatch, shuffleArray]);

  // проверяем первый запуск
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(INTRO_KEY);
        if (!alive) return;
        setShowIntro(!seen);
      } catch {
        if (!alive) return;
        setShowIntro(true);
      } finally {
        if (alive) setIntroChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // прячем таббар, пока интро активно
  useEffect(() => {
    try {
      (navigation as any)?.setOptions?.({
        tabBarStyle: showIntro ? { display: 'none' } : { display: 'flex' },
      });
    } catch {
      // ok
    }
  }, [navigation, showIntro]);

  // блокируем Android Back, чтобы интро нельзя было “пропустить”
  useEffect(() => {
    if (!showIntro) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [showIntro]);

  // грузим товары только когда интро закрыто
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (!introChecked) return;
    if (showIntro) return;

    const loadId = ++loadIdRef.current;

    setIsLoading(true);

    fetchProducts()
      .catch((e) => {
        console.error('Ошибка при загрузке:', e);
        dispatch(setProducts([]));
      })
      .finally(() => {
        // выключаем лоадер только для последнего актуального запроса
        if (loadId === loadIdRef.current) setIsLoading(false);
      });
  }, [introChecked, showIntro, fetchProducts, dispatch, updateProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProducts();
    } catch (e) {
      console.error('Ошибка при обновлении:', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts]);

  const finishIntro = useCallback(
    async (role: Role) => {
      try {
        await AsyncStorage.setItem(INTRO_KEY, '1');
        await AsyncStorage.setItem(ROLE_KEY, role);
      } catch (err) {
        console.error('Ошибка при сохранении интро', err);
      }

      // ✅ закрываем интро
      setShowIntro(false);

      // ✅ сразу запускаем загрузку, чтобы не было “пусто пока не reload”
      try {
        setIsLoading(true);
        await fetchProducts();
      } catch (e) {
        console.error('Ошибка при загрузке после интро:', e);
        dispatch(setProducts([]));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProducts, dispatch],
  );

  if (!introChecked) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <Text style={{ color: TEXT_MUTED }}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  if (showIntro) {
    return <Intro onDone={finishIntro} />;
  }

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl colors={['#338fd4']} refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View>
          <Header />
          <ProductList products={products} isLoading={isLoading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
