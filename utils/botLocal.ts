// utils/botLocal.ts
import { pipeline } from "@xenova/transformers";

let chatBot: any = null;
export const getBotReply = async (message: string) => {
  if (!chatBot) {
    chatBot = await pipeline(
      "text-generation",
      "Xenova/distilgpt2",
      {
        quantized: true,
      },
      // четвёртый аргумент — базовая ссылка для загрузки моделей
      "https://cdn.jsdelivr.net/gh/xenova/transformers.js@main/"
    );
  }

  const prompt = `Ты — консультант по имени Арман.\nПользователь: ${message}\nАрман:`;
  const out = await chatBot(prompt, {
    max_new_tokens: 80,
    temperature: 0.7,
  });
  return out.generated_text.split("\n")[0].trim();
};
