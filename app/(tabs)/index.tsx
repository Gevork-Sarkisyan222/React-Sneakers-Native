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
import * as Updates from 'expo-updates';

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
    'Lenina',
    'Pushkina',
    'Gagarina',
    'Tbilisi Street',
    'Sadovaya',
    'Mira',
    'Shota Rustaveli',
    'Narodnaya',
  ];

  const CITIES = [
    'Moscow, Russia',
    'Tbilisi, Georgia',
    'Yerevan, Armenia',
    'Batumi, Georgia',
    'Saint Petersburg, Russia',
    'USA, Los Angeles',
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
      setCreateError('Enter your first and last name.');
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
      setCreateError(
        'Failed to create a demo account. Check your internet connection and try again.',
      );
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
        desc: 'A training store simulation. You can safely practice: products, product pages, favorites, cart, and “purchases”, plus many other features and interactions inside the app.',
      },
      {
        key: '2',
        icon: { uri: 'https://cdn-icons-png.flaticon.com/512/18091/18091014.png' },
        title: 'Roles & practice',
        desc: 'Try being a user, admin, super admin, or owner — to understand access rights and management inside the app. Do your practice here.',
      },
      {
        key: '3',
        icon: '🧠',
        title: 'Helpful for beginners and kids',
        desc: 'This is an “interface trainer”: how the cart, balance, and user actions work. It’s also useful as practice for moderators/admins. Learn how a store works from the inside.',
      },
      {
        key: '4',
        icon: '💳',
        title: 'Important: everything is test',
        badge: 'DEMO • PAYMENTS ARE NOT REAL',
        desc: 'Any “purchases”, “top-ups”, amounts, and “cards” are a demo simulation. You can create an account and use all features. Why not try it?',
      },
    ],
    [],
  );

  const adminQuiz: QuizQuestion[] = useMemo(
    () => [
      {
        id: 'a1',
        question: 'What does an Admin usually do with products in the admin panel?',
        options: [
          'Creates/edits products and changes their settings',
          'Only buys products like a regular user',
          'Has no access to products at all',
        ],
        correctIndex: 0,
        tip: 'An Admin manages the store’s content.',
      },
      {
        id: 'a2',
        question:
          'If a product shouldn’t be shown in the store temporarily, what is the most logical action?',
        options: ['Delete it forever', 'Hide/deactivate the product', 'Add it to favorites'],
        correctIndex: 1,
        tip: 'In real admin panels, products are usually “hidden”, not deleted.',
      },
      {
        id: 'a3',
        question: 'A user wrote a bad comment. What is the correct order of actions for an admin?',
        options: [
          'Delete everything right away without checking',
          'Review it and remove/hide it by the rules + restrict if needed',
          'Reply “ok” and leave it as is',
        ],
        correctIndex: 1,
        tip: 'First review, then take action according to the rules.',
      },
      {
        id: 'a4',
        question: 'What is important to check after editing a product (price/name/photos)?',
        options: [
          'That the changes were saved and are shown in the list/product page',
          'That the app became “prettier”',
          'That the admin’s balance increased',
        ],
        correctIndex: 0,
        tip: 'An admin always checks: saved → displayed.',
      },
      {
        id: 'a5',
        question: 'How does an admin usually handle requests/reports?',
        options: [
          'Checks the queue, makes a decision, and records the result',
          'Ignores it because it’s not their area',
          'Sends all users a notification: “don’t write”',
        ],
        correctIndex: 0,
        tip: 'Queue → decision → result (the logic of most admin panels).',
      },
    ],
    [],
  );

  const superAdminQuiz: QuizQuestion[] = useMemo(
    () => [
      {
        id: 's1',
        question: 'What is the main difference between a Super Admin and an Admin?',
        options: [
          'A Super Admin manages roles/permissions and system settings',
          'A Super Admin just scrolls products faster',
          'There is no difference at all',
        ],
        correctIndex: 0,
        tip: 'A Super Admin manages access and rules.',
      },
      {
        id: 's2',
        question: 'You need to grant access to a new admin. What is the correct approach?',
        options: [
          'Give maximum permissions right away',
          'Give only the necessary permissions for the tasks and expand if needed',
          'Don’t give access to anyone',
        ],
        correctIndex: 1,
        tip: 'It’s best to grant the minimum needed and expand when necessary.',
      },
      {
        id: 's3',
        question:
          'A user complains: “I lost access to the admin panel.” What should you check first?',
        options: [
          'Their role/position and permissions',
          'The theme color in the app',
          'The number of products in the catalog',
        ],
        correctIndex: 0,
        tip: 'Start with access rights: role → permissions.',
      },
      {
        id: 's4',
        question:
          'If an admin accidentally deletes important data, what is the “right” approach in real systems?',
        options: [
          'None — deleted means deleted',
          'Use “soft delete”/restore or a change history',
          'Ask the user not to complain',
        ],
        correctIndex: 1,
        tip: 'Real admin panels often have restore/history.',
      },
      {
        id: 's5',
        question:
          'If an admin accidentally gave a user the “Admin” status, what should the super admin do?',
        options: [
          'Restore the correct role/status and save the changes',
          'Leave it as is so as “not to touch” the system',
          'Delete the user’s account',
        ],
        correctIndex: 0,
        tip: 'A super admin is responsible for correct roles and access.',
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
    if (role === 'admin') return 'Admin Guide';
    if (role === 'superadmin') return 'Super Admin Guide';
    return 'User Guide';
  }, [role]);

  const guideBullets = useMemo(() => {
    if (role === 'admin') {
      return [
        'Open the admin panel and check which sections are available for your role.',
        'Practice managing content: adding/editing data (everything is in a test database).',
        'Moderation: review comments/reports and learn to make decisions based on the rules.',
        'You can explore all features inside the admin panel.',
      ];
    }

    if (role === 'superadmin') {
      return [
        'Check role/permission management: who is allowed to do what.',
        'Keep things in order: review disputed actions and make careful decisions.',
        'Practice “least privilege”: grant only the necessary permissions to reduce mistakes.',
        'Validate moderation logic and admin workflows using test data.',
        'Running promotions/discounts or closing the store during development is up to you.',
        'You can explore all features inside the admin panel.',
      ];
    }

    return [
      'Browse products, open product pages, and explore the store interface.',
      'Add items to favorites and build your own “showcase” of things you like.',
      'Simulate purchases/actions — this is training, there are no real payments, don’t worry.',
      'If you see balance/top-ups — it’s demo. Don’t enter real data; just type any numbers so the system accepts it, and the amount you want.',
      'Buy cases and get bonuses.',
      'Complete quests and earn new bonuses — all your earned bonuses will be in the cart.',
      'Once you’re comfortable, you can enter the app and just use it — there’s a lot inside.',
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
          Step {currentStep} of {totalSteps}
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
              Training simulation • test data • no real payments are made
            </Text>

            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton
                title="Back"
                onPress={() => goToSlide(slideIndex - 1)}
                hidden={slideIndex === 0}
              />

              <PrimaryButton title={isLastSlide ? 'Next' : 'Next'} onPress={goNextFromSlides} />

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
              Who do you want to be?
            </Text>

            <Text style={{ color: TEXT_MUTED, marginTop: 10, textAlign: 'center', lineHeight: 18 }}>
              Your role affects the training. For Admin/Super Admin there will be a short quiz and a
              separate guide.
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <RoleCard
              title="User"
              subtitle="Browse products, favorites, cart, and demo purchases. No admin panel management."
              selected={role === 'user'}
              onPress={() => setRole('user')}
            />
            <RoleCard
              title="Admin"
              subtitle="Practice content management and moderation. Access to admin features."
              selected={role === 'admin'}
              onPress={() => setRole('admin')}
            />
            <RoleCard
              title="Super Admin"
              subtitle="Roles/permissions, process control, and broader access."
              selected={role === 'superadmin'}
              onPress={() => setRole('superadmin')}
            />
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 18 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, textAlign: 'center', lineHeight: 15 }}>
              Do not enter real passwords or banking details. This is training.
            </Text>

            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <GhostButton title="Back" onPress={() => setStage('slides')} />
              <PrimaryButton title="Continue" onPress={startTraining} disabled={!role} />
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
              Mini quiz: {role === 'admin' ? 'Admin' : 'Super Admin'}
            </Text>
            <Text style={{ color: TEXT_MUTED, marginTop: 8 }}>
              Question {quizIndex + 1} of {quiz.length}
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
                Tip: {quiz[quizIndex].tip}
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
                title="Back"
                onPress={() => {
                  if (quizIndex === 0) setStage('role');
                  else setQuizIndex((v) => Math.max(0, v - 1));
                }}
              />

              <PrimaryButton
                width="60%"
                title={quizIndex === quiz.length - 1 ? 'Finish' : 'Next'}
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
                Quiz result: {quizScore}/{quiz.length} (this is just training)
              </Text>
            ) : (
              <Text
                style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                Here’s a short “game-style” plan: what to try right now to get comfortable fast.
              </Text>
            )}
          </View>

          {/* ✅ THIS IS WHERE THE “TRAINING GUIDE” SHOULD BE */}
          <View style={{ ...CARD, marginTop: 12 }}>
            {guideBullets.map((t, idx) => (
              <GuideBullet key={`${idx}-${t}`} text={t} />
            ))}

            <View style={{ marginTop: 14 }}>
              <Chip text="DEMO • PAYMENTS ARE NOT REAL" />
              <Text
                style={{ color: TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginTop: 10 }}>
                Everything you enter and do is only in a test database. Do not use real data.
              </Text>
            </View>
          </View>

          {role === 'user' && (
            <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
              For the “User” role, the account is created manually. Tap below and register on the
              login screen.
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
                title="Back"
                onPress={() => {
                  if (role === 'user') setStage('role');
                  else setStage('quiz');
                }}
              />

              {role === 'user' ? (
                <PrimaryButton
                  width="60%"
                  title="Go to login"
                  onPress={() => {
                    onDone(role);
                    router.replace('/login');
                  }}
                />
              ) : (
                <PrimaryButton
                  title={role === 'admin' ? 'Get Admin access' : 'Get Super Admin access'}
                  onPress={() => setStage('setup')} // ✅ now this is a separate step
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
              {role === 'admin' ? 'Getting Admin access' : 'Getting Super Admin access'}
            </Text>

            {!creating && (
              <Text
                style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                Enter your first and last name — we’ll generate an email, create a test account, and
                sign you in right away.
              </Text>
            )}
          </View>

          {!creating && (
            <View style={{ ...CARD, marginTop: 12 }}>
              <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '800' }}>
                Enter your details
              </Text>

              <Text style={{ color: TEXT_MAIN, marginTop: 12, marginBottom: 6, fontWeight: '700' }}>
                First name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
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
                Last name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
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
                Your email will look like:{' '}
                <Text style={{ color: TEXT_MAIN, fontWeight: '800' }}>{emailPreview}</Text>
              </Text>

              <Text style={{ color: TEXT_MUTED, marginTop: 10, lineHeight: 18 }}>
                📸 After creating the account, take a screenshot of this screen with the details
                (just in case).
              </Text>
            </View>
          )}

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
              <ActivityIndicator
                size="large"
                color={PRIMARY}
                style={{ transform: [{ scale: 1.3 }] }}
              />

              <Text style={{ color: TEXT_MAIN, marginTop: 12, fontWeight: '900', fontSize: 16 }}>
                {role === 'admin'
                  ? 'Preparing your admin account…'
                  : 'Preparing your super admin account…'}
              </Text>

              <Text
                style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                <Text className="text-black font-semibold">
                  {createPhase === 'create'
                    ? 'Step 1/2: creating a profile in the test database.'
                    : 'Step 2/2: signing in and saving the token.'}
                </Text>
                {'\n'}This usually takes a few minutes or longer — please wait. You can put your
                phone down and calmly make some tea — we’ll finish everything. Please do not close
                the app.
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
              <GhostButton title="Back" onPress={() => setStage('guide')} hidden={creating} />

              <PrimaryButton
                title={role === 'admin' ? 'Create admin account' : 'Create super admin account'}
                onPress={() => createRoleAccount(role)}
                disabled={creating || !canCreate}
                loading={createPhase !== 'idle'}
                loadingText={'Creating account…'}
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
              Account is ready ✅
            </Text>

            <Text style={{ color: TEXT_MUTED, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
              This is your test account: {createdCreds.position.toUpperCase()}. 📸 Make sure to take
              a screenshot of this screen (Email/Password) so you don’t lose the details.
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
                <Text style={{ fontWeight: '900', color: TEXT_MAIN }}>Copy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: TEXT_MUTED, fontWeight: '800', marginTop: 14 }}>Password</Text>
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
                <Text style={{ fontWeight: '900', color: TEXT_MAIN }}>Copy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginTop: 15 }}>
              Balance: {createdCreds.balance.toLocaleString()} ₽ • role: {createdCreds.position}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 18, display: 'flex', alignItems: 'center' }}>
            <PrimaryButton
              title="Go to Home"
              onPress={async () => {
                if (!role) return;
                await onDone(role as any);
                await Updates.reloadAsync();
              }}
            />

            <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
              You’re already signed in ✅ The details above are just a “backup” in case you ever
              want to log in manually.
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

  //  old
  // const fetchProducts = useCallback(async () => {
  //   const res = await axios.get<Product[]>(
  //     'https://dcc2e55f63f7f47b.mokky.dev/products?_select=-description,-comments',
  //   );
  //   dispatch(setProducts(shuffleArray(res.data)));
  // }, [dispatch, shuffleArray]);

  // new
  const PRODUCTS_CACHE_KEY = 'native_sneakers_products_cache_v1';

  const shuffleArray = useCallback((arr: Product[]) => {
    const a = [...arr]; // ВАЖНО: именно [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  const fetchProducts = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;

      try {
        if (!silent) setIsLoading(true);

        const res = await axios.get<Product[]>(
          'https://dcc2e55f63f7f47b.mokky.dev/products?_select=-description,-comments',
          { timeout: 20000 },
        );

        const shuffled = shuffleArray(res.data);
        dispatch(setProducts(shuffled));

        // кеш на следующий запуск
        AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(shuffled)).catch(() => {});
      } catch (e) {
        console.log('fetchProducts error', e);
        // НЕ ОБНУЛЯЙ если уже есть продукты — но минимум так:
        dispatch(setProducts([]));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [dispatch, shuffleArray],
  );

  // 1) мгновенно отрисовать из кеша (без ожидания сети)
  useEffect(() => {
    if (!introChecked) return;

    let alive = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
        if (!alive || !cached) return;

        const parsed = JSON.parse(cached) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch(setProducts(parsed));
        }
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, [introChecked, dispatch]);

  // 2) один раз префетчим сеть В ФОНЕ сразу при старте (даже когда интро открыто)
  const prefetchStartedRef = useRef(false);

  useEffect(() => {
    if (!introChecked) return;
    if (prefetchStartedRef.current) return;

    prefetchStartedRef.current = true;
    void fetchProducts({ silent: true });
  }, [introChecked, fetchProducts]);

  // 3) если у тебя есть updateProductsEffect — обновляй, но только когда интро закрыто
  useEffect(() => {
    if (!introChecked) return;
    if (showIntro) return;
    if (products.length > 0) return;

    fetchProducts(); // тут можно silent:true если хочешь без спиннера
  }, [introChecked, showIntro, products.length, fetchProducts]);

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

    // ✅ если finishIntro уже успел загрузить — не грузим второй раз
    if (products.length > 0) return;

    const loadId = ++loadIdRef.current;
    setIsLoading(true);

    fetchProducts()
      .catch((e) => {
        console.error('Ошибка при загрузке:', e);
        dispatch(setProducts([]));
      })
      .finally(() => {
        if (loadId === loadIdRef.current) setIsLoading(false);
      });
  }, [introChecked, showIntro, products.length, fetchProducts, dispatch, updateProducts]);

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

  const finishIntro = useCallback(async (role: Role) => {
    try {
      // 1) сохраняем факт прохождения интро + выбранную роль
      await AsyncStorage.multiSet([
        [INTRO_KEY, '1'],
        [ROLE_KEY, role],
      ]);
    } catch (err) {
      console.error('Ошибка при сохранении интро', err);
    }

    // 2) НЕ делаем fetchProducts здесь — чтобы не было задержек/повторной загрузки
    setShowIntro(false);
  }, []);

  if (!introChecked) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <Text style={{ color: TEXT_MUTED }}>Loading...</Text>
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
          <ProductList products={products} isLoading={products.length === 0 && isLoading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
