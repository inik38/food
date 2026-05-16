import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Ошибка: GEMINI_API_KEY не найден');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('✅ Gemini API подключен');

const CHEF_PROMPT = `Ты — профессиональный шеф-повар.
Отвечай ТОЛЬКО реальными, проверенными рецептами.

Формат ответа:
🍽️ **НАЗВАНИЕ БЛЮДА**

⏱️ **Время:** X мин | 📊 **Сложность:** (Легко/Средне/Сложно) | 👥 **Порции:** X

🛒 **Ингредиенты:**
• Ингредиент — количество

👨‍🍳 **ПРИГОТОВЛЕНИЕ:**
1. Первый шаг
2. Второй шаг

💡 **Совет шефа:** полезный лайфхак`;

app.post('/api/recipe', async (req, res) => {
    const { userMessage } = req.body;

    console.log('📩 Получен запрос:', userMessage);

    if (!userMessage) {
        return res.status(400).json({ error: 'Введите запрос' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: CHEF_PROMPT + "\n\nЗапрос: " + userMessage }] }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
            }
        });

        const reply = result.response.text();
        console.log('🤖 Ответ отправлен, длина:', reply.length);
        res.json({ reply: reply });

    } catch (error) {
        console.error('❌ Gemini Error:', error);
        res.status(500).json({ error: 'Ошибка генерации рецепта: ' + error.message });
    }
});

app.post('/api/analyze-image', async (req, res) => {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Нет фото' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Определи продукты на фото и предложи 1-2 рецепта из них. Формат: список продуктов + рецепт по стандартному шаблону шефа." },
                        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2000,
            }
        });

        res.json({ reply: result.response.text() });
    } catch (error) {
        console.error('❌ Image error:', error);
        res.status(500).json({ error: 'Не удалось распознать фото: ' + error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🍳 Шеф-повар запущен на порту ${PORT}`);
});