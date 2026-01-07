import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

/** =========================
 *  TYPING SPEED SETTINGS
 *  ========================= */
// The smaller the value, the faster the typing. 1 = base speed, 0.6 = faster (~40%).
const SPEED_MULT = 0.6;

// How many characters we add per tick (speeds up typing without losing “naturalness”)
const CHARS_PER_TICK_DEFAULT = 2;
const CHARS_PER_TICK_SLOW = 1; // for line breaks / punctuation

// Base delays (ms) per typing tick — then multiply by SPEED_MULT:
const BASE_DELAY_FAST = 6; // for spaces / line breaks / punctuation
const BASE_DELAY_NORMAL = 12; // for regular characters
const JITTER = 8; // small randomness to feel “more alive”

/** =========================
 *  FAQ DATA (Play Market-friendly, no payments)
 *  ========================= */
type FaqItem = {
  id: string;
  q: string; // for suggestions
  a: string; // ready answer
  keywords: string[];
};

const FAQ_DATA: FaqItem[] = [
  {
    id: 'delivery',
    q: 'Delivery time & cost',
    a:
      'Delivery within Georgia usually takes 1–3 business days. International delivery typically takes 5–10 business days. ' +
      'The cost depends on the city/region and parcel weight. The exact total is shown in the cart before you confirm the order.',
    keywords: [
      'delivery',
      'shipping',
      'when will it arrive',
      'delivery cost',
      'shipping cost',
      'shipping price',
      'delivery time',
      'how long',
      'courier',
    ],
  },
  {
    id: 'refund',
    q: 'How do I request a refund or return?',
    a:
      'Open Profile → “Refunds/Returns”, choose the order, and follow the steps. ' +
      'Returns are usually accepted within 14 days if the item is in good condition and in the original packaging.',
    keywords: [
      'refund',
      'return',
      'returns',
      'exchange',
      'money back',
      'return policy',
      'cancel order',
    ],
  },
  {
    id: 'track',
    q: 'How do I track my order?',
    a:
      'After shipping, you’ll receive a tracking number in notifications (and email, if enabled). ' +
      'You can also find it in Profile → “My orders”.',
    keywords: [
      'track',
      'tracking',
      'tracking number',
      'where is my order',
      'order status',
      'shipment',
    ],
  },
  {
    id: 'sizes',
    q: 'Sizes & exchanges',
    a:
      'A size chart is available on the product page. If the size doesn’t fit, request an exchange in Profile → “Refunds/Returns”. ' +
      'We’ll suggest the closest available size based on your choice.',
    keywords: [
      'size',
      'sizes',
      'size chart',
      "doesn't fit",
      'exchange size',
      'sizing',
      'measurements',
    ],
  },
  {
    id: 'acc',
    q: 'Login / account issues',
    a: 'Try “Reset password” using your email/phone. If you still can’t sign in, open Profile → “Help” and contact support.',
    keywords: [
      'login',
      'sign in',
      'password',
      'account',
      'authorization',
      'reset password',
      'can’t log in',
    ],
  },
  {
    id: 'contacts',
    q: 'Contacts & support',
    a:
      'In-app support: Profile → “Help”. Working hours: 10:00–20:00. ' +
      'Email: support@yourapp.com. We reply as soon as possible.',
    keywords: [
      'contacts',
      'support',
      'help',
      'email',
      'contact',
      'customer support',
      'working hours',
    ],
  },
];

// Quick suggestions at the start of the chat (no payments)
const QUICK_SUGGESTIONS = [
  'Delivery time & cost',
  'How do I request a refund or return?',
  'How do I track my order?',
  'Sizes & exchanges',
  'Login / account issues',
  'Contacts & support',
];

/** =========================
 *  NLU UTILITIES (offline)
 *  ========================= */

/** String normalization */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Simple stemming (suffix trimming) — rough, but helps */
function crudeStem(w: string) {
  return w.replace(/(ing|ed|es|s|ly|ment|tion|ions|able|less|ness|er|ers|est|ful|ish)$/i, '');
}

/** Levenshtein distance for catching typos */
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Improved offline FAQ matching with typos and word forms */
function matchFaq(userText: string) {
  const text = normalize(userText);
  if (!text) return null as null | { item: FaqItem; score: number };

  const tokens = text.split(' ').filter((w) => w.length > 2);
  const stems = new Set(tokens.map(crudeStem));

  let best: { item: FaqItem; score: number } | null = null;

  for (const item of FAQ_DATA) {
    let score = 0;

    // 1) keywords
    for (const kwRaw of item.keywords) {
      const kw = normalize(kwRaw);
      if (!kw) continue;

      // exact phrase match
      if (text.includes(kw)) score += 3;

      // token + stemming
      const kwStem = crudeStem(kw);
      if (!kw.includes(' ') && stems.has(kwStem)) score += 1.5;

      // typos: Levenshtein closeness to tokens
      for (const t of tokens) {
        if (Math.abs(t.length - kw.length) > 2) continue;
        const d = levenshtein(t, kw);
        if (d === 1) score += 1;
        else if (d === 2 && kw.length >= 6) score += 0.5;
      }
    }

    // 2) matches with words from the question text
    for (const qw of normalize(item.q)
      .split(' ')
      .filter((w) => w.length > 2)) {
      if (stems.has(crudeStem(qw))) score += 0.5;
    }

    // 3) small bonus for common triggers (no payments)
    if (/\b(how|when|where|delivery|refund|return|size|track|support|login|account)\b/i.test(text))
      score += 0.3;

    if (!best || score > best.score) best = { item, score };
  }

  // threshold
  return best && best.score >= 2 ? best : null;
}

/** Follow-ups: which quick actions to show under the answer */
function followUpsById(id: string): string[] {
  switch (id) {
    case 'delivery':
      return ['My city is Tbilisi', 'Another city', 'International delivery'];
    case 'track':
      return ['Where is the tracking number?', "The order isn't moving", 'Contact support'];
    case 'refund':
      return ['Start a return', 'Refund timelines', 'Exchange instead of return'];
    case 'acc':
      return ['Reset password', 'Sign in with phone', 'Contact support'];
    case 'sizes':
      return ['Open size chart', 'Help me choose a size', 'Exchange the item'];
    case 'contacts':
      return ['Message in chat', 'Email support', 'Working hours'];
    default:
      return ['Delivery time & cost', 'Returns & refunds', 'Contact support'];
  }
}

/** “Human” answer generator */
function craftAnswer(userText: string) {
  const match = matchFaq(userText);
  const introPool = [
    'Got it!',
    'Okay, here’s the short version.',
    'Here’s how it works:',
    'Let’s sort it out:',
  ];
  const outroPool = [
    'If you want, share a couple of details and I’ll guide you further.',
    'If needed, I can list the steps point by point.',
    'Happy to help with the exact steps.',
  ];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (match) {
    const { item } = match;
    const followUps = followUpsById(item.id);

    const clarifier =
      item.id === 'delivery'
        ? 'Which city/region is the delivery for?'
        : item.id === 'refund'
          ? 'Do you want a return or an exchange?'
          : item.id === 'sizes'
            ? 'Which product do you need the size for?'
            : item.id === 'track'
              ? 'Do you already have a tracking number?'
              : item.id === 'acc'
                ? 'Are you signing in with email or phone?'
                : null;

    const text =
      `${pick(introPool)} ${item.a}\n\n` +
      (clarifier ? `Quick question: ${clarifier}\n` : '') +
      `${pick(outroPool)}`;

    return { text, followUps };
  }

  // Fallback when there is no exact match
  const related = QUICK_SUGGESTIONS.slice(0, 3);
  const text =
    'I want to answer accurately, but I’m not sure I understood your request yet. ' +
    'Could you rephrase it in 1–2 sentences or pick one of the popular questions below?';

  return { text, followUps: related };
}

/** =========================
 *  CHAT WITH “HUMAN” FEEL (streaming + typing)
 *  ========================= */
type Sender = 'user' | 'bot' | 'system';
type Message = {
  id: string;
  text: string;
  sender: Sender;
  time: string;
  followUps?: string[];
  typing?: boolean;
};

export default function ChatPage() {
  function now() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'hello',
      text:
        'Hi! I’m Arman — an assistant. I can help with delivery, tracking, returns, sizes, and support. ' +
        'Pick a question below or just type — I’ll answer clearly and to the point.',
      sender: 'bot',
      time: now(),
      followUps: QUICK_SUGGESTIONS,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Scroll down on new messages
  useEffect(() => {
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages]);

  /** Main send */
  const sendMessage = async (presetText?: string) => {
    const text = (presetText ?? inputText).trim();
    if (!text || isLoading) return;

    // User message
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      text,
      sender: 'user',
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // “Arman is typing…”
    const typingId = `t_${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        text: 'Typing…',
        sender: 'bot',
        time: now(),
        typing: true,
      },
    ]);

    try {
      // “Thinking” simulation (fast)
      await sleep(150 + Math.random() * 150);

      // Generate answer
      const { text: botText, followUps } = craftAnswer(text);

      // Remove typing, add empty message to stream into
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      const botMsgId = `b_${Date.now() + 2}`;
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, text: '', sender: 'bot', time: now(), followUps },
      ]);

      // Stream characters
      await streamText(botMsgId, botText, setMessages);
    } finally {
      setIsLoading(false);
    }
  };

  /** Render a message */
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const bubbleColor = isUser ? 'bg-[#9dd357]' : 'bg-gray-100';
    const textColor = isUser ? 'text-white' : 'text-gray-800';
    const cornerClass = isUser ? 'rounded-br-none' : 'rounded-bl-none';

    return (
      <View className={`my-1 px-4 ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`p-3 rounded-2xl max-w-[85%] ${bubbleColor} ${cornerClass}`}>
          <Text className={`${textColor}`}>{item.text}</Text>
          <Text className={`text-xs mt-1 ${isUser ? 'text-white/80' : 'text-gray-500'}`}>
            {item.typing ? '…' : item.time}
          </Text>

          {/* Quick actions under bot message */}
          {!isUser && item.followUps?.length ? (
            <View className="mt-2 flex-row flex-wrap">
              {item.followUps.map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  onPress={() => sendMessage(lbl)}
                  className="bg-white border border-gray-200 px-3 py-1 rounded-full mr-2 mb-2">
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
          <Image
            source={{
              uri: 'https://cdn0.iconfinder.com/data/icons/professional-avatar-5/48/Junior_Consultant_male_avatar_men_character_professions-512.png',
            }}
            className="w-[41px] h-[41px] rounded-full mr-3"
          />
          <View>
            <Text className="font-bold text-lg text-gray-900">Arman</Text>
            <Text className="text-[12px] text-gray-500">
              <Text className="text-green-500 font-bold">Online</Text> • Assistant
            </Text>
            <Text className="text-[12px] text-gray-500">
              AI beta assistant. Text only. Many feautures coming soon
            </Text>
          </View>
        </View>

        {/* Quick questions (chips) */}
        <View className="py-2 border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {QUICK_SUGGESTIONS.map((label) => (
              <TouchableOpacity
                key={label}
                onPress={() => sendMessage(label)}
                className="bg-gray-100 px-3 py-2 rounded-full border border-gray-200">
                <Text className="text-gray-800">{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          className="flex-1"
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="pt-2 border-t border-gray-100">
          <View className="flex-row items-center px-4 pb-4">
            <TextInput
              className="flex-1 border border-gray-200 rounded-full py-3 px-5 mr-3 text-base"
              placeholder="Type your question..."
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
              className={`${inputText.trim() && !isLoading ? 'bg-[#9dd357]' : 'bg-gray-200'} w-12 h-12 rounded-full items-center justify-center`}>
              <Text className="text-white text-lg font-bold">➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/** =========================
 *  HELPERS: “typing…” and streaming
 *  ========================= */
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Compute delay per typing tick based on character type and SPEED_MULT */
function delayForChar(ch: string) {
  const fastChars = [' ', '\n', '.', ',', '!', '?', ':', ';', '—', '-', '…'];
  const isFast = fastChars.includes(ch);
  const base = isFast ? BASE_DELAY_FAST : BASE_DELAY_NORMAL;
  const jitter = Math.floor(Math.random() * JITTER);
  return Math.max(1, Math.floor((base + jitter) * SPEED_MULT));
}

/** Stream text in small chunks (faster) with “natural” pauses */
async function streamText(
  msgId: string,
  full: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  let acc = '';
  for (let i = 0; i < full.length; ) {
    const ch = full[i];

    const chunkSize =
      ch === '\n' || ch === ' ' || ['.', ',', '!', '?', ':', ';', '—', '-', '…'].includes(ch)
        ? CHARS_PER_TICK_SLOW
        : CHARS_PER_TICK_DEFAULT;

    const nextSlice = full.slice(i, Math.min(full.length, i + chunkSize));
    acc += nextSlice;
    i += nextSlice.length;

    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, text: acc } : m)));

    await sleep(delayForChar(ch));
  }
}
