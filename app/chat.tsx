import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/** =========================
 *  НАСТРОЙКИ СКОРОСТИ ПЕЧАТИ
 *  ========================= */
// Чем меньше значение, тем быстрее печать. 1 = базовая скорость, 0.6 = быстрее (~40%).
const SPEED_MULT = 0.6;

// Сколько символов добавляем за один тик (ускоряет печать без потери «натуральности»)
const CHARS_PER_TICK_DEFAULT = 2;
const CHARS_PER_TICK_SLOW = 1; // для переносов/пунктуации

// Базовые задержки (мс) на тик печати — далее умножаем на SPEED_MULT:
const BASE_DELAY_FAST = 6; // для пробелов/переносов/знаков
const BASE_DELAY_NORMAL = 12; // для обычных символов
const JITTER = 8; // лёгкий разброс, чтобы было «живее»

/** =========================
 *  ДАННЫЕ FAQ (редактируй под себя)
 *  ========================= */
type FaqItem = {
  id: string;
  q: string; // для подсказок
  a: string; // готовый ответ
  keywords: string[];
};

const FAQ_DATA: FaqItem[] = [
  {
    id: "pay",
    q: "Как оплатить заказ?",
    a: "Мы принимаем карты, Apple/Google Pay и TON/USDT. После оформления заказа переходи к оплате — на экране будут подсказки по шагам.",
    keywords: [
      "оплата",
      "заплатить",
      "карта",
      "google pay",
      "apple pay",
      "кошелек",
      "кошелёк",
      "ton",
      "usdt",
    ],
  },
  {
    id: "refund",
    q: "Как оформить возврат?",
    a: "Открой профиль → «Возвраты». Заполни форму и следуй шагам. Мы принимаем возвраты в течение 14 дней при сохранности товара.",
    keywords: ["возврат", "рефанд", "вернуть", "обмен", "refund"],
  },
  {
    id: "delivery",
    q: "Сроки и стоимость доставки",
    a: "По Грузии 1–3 дня, международно 5–10 дней. Стоимость зависит от города и веса — точная сумма будет в корзине перед оплатой.",
    keywords: [
      "доставка",
      "сроки",
      "когда привезут",
      "стоимость доставки",
      "цена доставки",
      "shipping",
    ],
  },
  {
    id: "track",
    q: "Как отследить заказ?",
    a: "После отправки придёт трек-номер в уведомления и на почту. Также отслеживание доступно в профиле → «Мои заказы».",
    keywords: ["отследить", "трек", "трек-номер", "tracking", "где заказ"],
  },
  {
    id: "acc",
    q: "Проблемы со входом / аккаунтом",
    a: "Попробуй «Сбросить пароль» по e-mail/телефону. Если не помогло — напиши нам в поддержку в разделе «Помощь».",
    keywords: ["вход", "логин", "пароль", "аккаунт", "зайти", "авторизация"],
  },
  {
    id: "pay-crypto",
    q: "Оплата криптой (TON/USDT)",
    a: "Выбери TON или USDT при оплате. Система покажет адрес/QR. Переведи точную сумму в течение 15 минут — заказ подтвердится автоматически.",
    keywords: ["крипта", "тон", "usdt", "кошелек", "кошелёк", "wallet", "qr"],
  },
  {
    id: "contacts",
    q: "Контакты и поддержка",
    a: "Поддержка в приложении: профиль → «Помощь» (чат 10:00–20:00). Почта: support@example.com. Отвечаем максимально быстро.",
    keywords: ["контакты", "поддержка", "help", "саппорт", "почта", "написать"],
  },
  {
    id: "sizes",
    q: "Размеры и обмен",
    a: "Таблица размеров есть на странице товара. Если не подошло — оформи обмен через «Возвраты», подскажем ближайший размер.",
    keywords: [
      "размер",
      "таблица размеров",
      "подошел",
      "подошло",
      "обмен размер",
    ],
  },
];

// Быстрые подсказки в начале диалога
const QUICK_SUGGESTIONS = [
  "Как оплатить заказ?",
  "Сроки и стоимость доставки",
  "Как оформить возврат?",
  "Оплата криптой (TON/USDT)",
  "Как отследить заказ?",
  "Контакты и поддержка",
];

/** =========================
 *  УТИЛИТЫ NLU (офлайн)
 *  ========================= */

/** Нормализация строки */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ё]/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Примитивный стемминг (обрезка окончаний) — работает грубо, но помогает */
function crudeStem(w: string) {
  return w.replace(
    /(иями|ями|ами|ями|ыми|ими|ому|ему|ого|его|ая|яя|ий|ый|ой|ое|ее|ие|ые|ую|юю|ам|ям|ов|ев|ем|им|ах|ях|ом|ем|ью|их|ых|ой|ей|ии|ии|ам|ям|ою|ею)$/u,
    ""
  );
}

/** Левенштейн для ловли опечаток */
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

/** Улучшенный офлайн-матчинг FAQ с опечатками и формами слов */
function matchFaq(userText: string) {
  const text = normalize(userText);
  if (!text) return null as null | { item: FaqItem; score: number };

  const tokens = text.split(" ").filter((w) => w.length > 2);
  const stems = new Set(tokens.map(crudeStem));

  let best: { item: FaqItem; score: number } | null = null;

  for (const item of FAQ_DATA) {
    let score = 0;

    // 1) ключевые слова
    for (const kwRaw of item.keywords) {
      const kw = normalize(kwRaw);
      if (!kw) continue;

      // точное вхождение фразы
      if (text.includes(kw)) score += 3;

      // токен + стемминг
      const kwStem = crudeStem(kw);
      if (!kw.includes(" ") && stems.has(kwStem)) score += 1.5;

      // опечатки: близость по Левенштейну с токенами
      for (const t of tokens) {
        if (Math.abs(t.length - kw.length) > 2) continue;
        const d = levenshtein(t, kw);
        if (d === 1) score += 1;
        else if (d === 2 && kw.length >= 6) score += 0.5;
      }
    }

    // 2) совпадения со словами из формулировки вопроса
    for (const qw of normalize(item.q)
      .split(" ")
      .filter((w) => w.length > 2)) {
      if (stems.has(crudeStem(qw))) score += 0.5;
    }

    // 3) лёгкий бонус за общеупотребимые триггеры
    if (
      /\b(как|когда|где|сколько|оплата|доставка|возврат|размер)\b/u.test(text)
    )
      score += 0.3;

    if (!best || score > best.score) best = { item, score };
  }

  // Порог можно крутить под себя
  return best && best.score >= 2 ? best : null;
}

/** Подскаки: какие уточняющие вопросы/быстрые действия дать под ответ */
function followUpsById(id: string): string[] {
  switch (id) {
    case "pay":
      return ["Оплатить картой", "Оплатить криптой", "Какие комиссии?"];
    case "pay-crypto":
      return ["Показать QR", "USDT вместо TON", "Оплатить позже"];
    case "delivery":
      return ["Мой город — Тбилиси", "Другой город", "Международная доставка"];
    case "track":
      return [
        "Где трек-номер?",
        "Заказ не двигается",
        "Связаться с поддержкой",
      ];
    case "refund":
      return ["Оформить возврат", "Сроки по возврату", "Обмен вместо возврата"];
    case "acc":
      return ["Сбросить пароль", "Войти по телефону", "Написать в поддержку"];
    case "sizes":
      return ["Открыть таблицу размеров", "Подобрать размер", "Обменять товар"];
    case "contacts":
      return ["Написать в чат", "Email поддержке", "График работы"];
    default:
      return ["Уточнить вопрос", "Доставка", "Оплата"];
  }
}

/** Генератор «живого» ответа: объяснение + короткий резюме + уточняющий вопрос */
function craftAnswer(userText: string) {
  const match = matchFaq(userText);
  const introPool = [
    "Понял тебя!",
    "Окей, расскажу кратко.",
    "Смотри, как это работает:",
    "Разберёмся за минуту:",
  ];
  const outroPool = [
    "Если удобно, подскажи пару деталей — и я направлю дальше.",
    "Если нужно, могу дать шаги по пунктам.",
    "Готов помочь с конкретными шагами.",
  ];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (match) {
    const { item } = match;
    const followUps = followUpsById(item.id);
    const clarifier =
      item.id === "delivery"
        ? "В какой город планируется доставка?"
        : item.id === "pay"
          ? "Как удобнее — карта или крипта?"
          : item.id === "refund"
            ? "Что именно хочешь сделать — возврат или обмен?"
            : item.id === "sizes"
              ? "Для какого товара подобрать размер?"
              : null;

    const text =
      `${pick(introPool)} ${item.a}\n\n` +
      (clarifier ? `Вопрос уточнения: ${clarifier}\n` : "") +
      `${pick(outroPool)}`;

    return { text, followUps };
  }

  // Фолбэк, когда нет точного совпадения
  const related = QUICK_SUGGESTIONS.slice(0, 3);
  const text =
    "Хочу ответить точно, но пока не уверен, что правильно понял запрос. " +
    "Можешь переформулировать на 1–2 предложения или выбрать один из популярных вопросов ниже?";
  return { text, followUps: related };
}

/** =========================
 *  ЧАТ С «ЖИВОЙ» ПОДАЧЕЙ (стриминг + typing)
 *  ========================= */
type Sender = "user" | "bot" | "system";
type Message = {
  id: string;
  text: string;
  sender: Sender;
  time: string;
  followUps?: string[]; // быстрые ответы под сообщением бота
  typing?: boolean; // индикатор «печатает…»
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "hello",
      text:
        "Привет! Я Arman — офлайн-ассистент. Могу помочь с оплатой, доставкой, возвратом и т.д. " +
        "Выбери вопрос ниже или просто напиши — отвечу по делу.",
      sender: "bot",
      time: now(),
      followUps: QUICK_SUGGESTIONS,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  function now() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Скроллим вниз при новых сообщениях
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  /** Основная отправка */
  const sendMessage = async (presetText?: string) => {
    const text = (presetText ?? inputText).trim();
    if (!text || isLoading) return;

    // Сообщение пользователя
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      text,
      sender: "user",
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    // Ставим «Arman печатает…»
    const typingId = `t_${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        text: "Печатает…",
        sender: "bot",
        time: now(),
        typing: true,
      },
    ]);

    try {
      // Имитация «думания» (ускорено)
      await sleep(150 + Math.random() * 150);

      // Генерируем «живой» ответ
      const { text: botText, followUps } = craftAnswer(text);

      // Убираем типинг, добавляем пустое сообщение для стрима
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      const botMsgId = `b_${Date.now() + 2}`;
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, text: "", sender: "bot", time: now(), followUps },
      ]);

      // Стримим символы (эффект «человеческой печати», ускоренный)
      await streamText(botMsgId, botText, setMessages);
    } finally {
      setIsLoading(false);
    }
  };

  /** Рендер сообщения */
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    const bubbleColor = isUser ? "bg-[#9dd357]" : "bg-gray-100";
    const textColor = isUser ? "text-white" : "text-gray-800";
    const cornerClass = isUser ? "rounded-br-none" : "rounded-bl-none";

    return (
      <View className={`my-1 px-4 ${isUser ? "items-end" : "items-start"}`}>
        <View
          className={`p-3 rounded-2xl max-w-[85%] ${bubbleColor} ${cornerClass}`}
        >
          <Text className={`${textColor}`}>{item.text}</Text>
          <Text
            className={`text-xs mt-1 ${isUser ? "text-white/80" : "text-gray-500"}`}
          >
            {item.typing ? "…" : item.time}
          </Text>

          {/* Быстрые действия под сообщением бота */}
          {!isUser && item.followUps?.length ? (
            <View className="mt-2 flex-row flex-wrap">
              {item.followUps.map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  onPress={() => sendMessage(lbl)}
                  className="bg-white border border-gray-200 px-3 py-1 rounded-full mr-2 mb-2"
                >
                  <Text className="text-gray-700">{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
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
              <Text className="text-green-500 font-bold">Офлайн</Text> •
              Ассистент
            </Text>
          </View>
        </View>

        {/* Быстрые вопросы (чипсы) */}
        <View className="py-2 border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {QUICK_SUGGESTIONS.map((label) => (
              <TouchableOpacity
                key={label}
                onPress={() => sendMessage(label)}
                className="bg-gray-100 px-3 py-2 rounded-full border border-gray-200"
              >
                <Text className="text-gray-800">{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Сообщения */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          className="flex-1"
        />

        {/* Инпут */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="pt-2 border-t border-gray-100"
        >
          <View className="flex-row items-center px-4 pb-4">
            <TextInput
              className="flex-1 border border-gray-200 rounded-full py-3 px-5 mr-3 text-base"
              placeholder="Напишите вопрос..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor="#9ca3af"
              editable={!isLoading}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              className={`${
                inputText.trim() && !isLoading ? "bg-[#9dd357]" : "bg-gray-200"
              } w-12 h-12 rounded-full items-center justify-center`}
            >
              <Text className="text-white text-lg font-bold">➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/** =========================
 *  HELPERS: «печатает…» и стриминг
 *  ========================= */
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Вычисляем задержку на тик печати с учётом типа символов и SPEED_MULT */
function delayForChar(ch: string) {
  // Быстрые паузы — для пробела, переноса и «мягкой» пунктуации
  const fastChars = [" ", "\n", ".", ",", "!", "?", ":", ";", "—", "-", "…"];
  const isFast = fastChars.includes(ch);
  const base = isFast ? BASE_DELAY_FAST : BASE_DELAY_NORMAL;
  const jitter = Math.floor(Math.random() * JITTER);
  // Умножаем на SPEED_MULT и не даём упасть ниже 1 мс
  return Math.max(1, Math.floor((base + jitter) * SPEED_MULT));
}

/** Стримим текст пачками символов (ускорено), с «натуральными» паузами */
async function streamText(
  msgId: string,
  full: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  let acc = "";
  for (let i = 0; i < full.length; ) {
    const ch = full[i];

    // Для переносов/пунктуации — по 1 символу, для обычных — по 2
    const chunkSize =
      ch === "\n" ||
      ch === " " ||
      [".", ",", "!", "?", ":", ";", "—", "-", "…"].includes(ch)
        ? CHARS_PER_TICK_SLOW
        : CHARS_PER_TICK_DEFAULT;

    const nextSlice = full.slice(i, Math.min(full.length, i + chunkSize));
    acc += nextSlice;
    i += nextSlice.length;

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text: acc } : m))
    );

    await sleep(delayForChar(ch));
  }
}
