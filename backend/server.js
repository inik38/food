import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Проверка наличия ключа OpenRouter
if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Ошибка: OPENROUTER_API_KEY не найден в .env файле');
    process.exit(1);
}

console.log('✅ OpenRouter API подключен');

// Настройки OpenRouter
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Выбери модель (можно поменять на любую из OpenRouter):
// - "openai/gpt-4o" - GPT-4 Omni
// - "openai/gpt-4-turbo" - GPT-4 Turbo
// - "anthropic/claude-3.5-sonnet" - Claude 3.5 Sonnet
// - "meta-llama/llama-3.1-70b-instruct" - Llama 3.1 70B
// - "google/gemini-2.0-flash-exp:free" - Gemini 2.0 (бесплатно)
const MODEL = process.env.MODEL || "google/gemini-2.0-flash-exp:free";

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

// Функция для запроса к OpenRouter
async function callOpenRouter(messages, temperature = 0.7, maxTokens = 1500) {
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Culinary AI Chef'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens,
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Текстовые рецепты
app.post('/api/recipe', async (req, res) => {
    const { userMessage } = req.body;

    console.log('📩 Получен запрос:', userMessage);
    console.log('🤖 Используется модель:', MODEL);

    if (!userMessage) {
        return res.status(400).json({ error: 'Введите запрос' });
    }

    try {
        const messages = [
            { role: "system", content: CHEF_PROMPT },
            { role: "user", content: `Запрос: ${userMessage}` }
        ];

        const reply = await callOpenRouter(messages, 0.7, 1500);

        console.log('🤖 Ответ отправлен, длина:', reply.length);
        res.json({ reply: reply });

    } catch (error) {
        console.error('❌ OpenRouter Error:', error);
        res.status(500).json({ error: 'Ошибка генерации рецепта: ' + error.message });
    }
});

// Анализ фото (через OpenRouter с поддержкой vision)
app.post('/api/analyze-image', async (req, res) => {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Нет фото' });
    }

    // Для анализа фото нужна модель с поддержкой vision
    const visionModel = process.env.VISION_MODEL || "openai/gpt-4o-mini";

    console.log('📸 Анализ фото, модель:', visionModel);

    try {
        // Убираем префикс data:image/...;base64,
        let base64Data = imageBase64;
        if (imageBase64.includes(',')) {
            base64Data = imageBase64.split(',')[1];
        }

        // Определяем MIME тип
        let mimeType = "image/jpeg";
        if (imageBase64.includes('data:image/png')) {
            mimeType = "image/png";
        } else if (imageBase64.includes('data:image/webp')) {
            mimeType = "image/webp";
        }

        const messages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Определи все продукты на этом фото. Перечисли их списком. Затем предложи 1-2 рецепта из этих продуктов. Формат ответа: СПИСОК ПРОДУКТОВ, затем РЕЦЕПТЫ по стандартному шаблону шефа."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Data}`
                        }
                    }
                ]
            }
        ];

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
                'X-Title': 'Culinary AI Chef'
            },
            body: JSON.stringify({
                model: visionModel,
                messages: messages,
                temperature: 0.6,
                max_tokens: 2000,
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenRouter Vision API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        console.log('📸 Фото проанализировано, длина ответа:', reply.length);
        res.json({ reply: reply });

    } catch (error) {
        console.error('❌ Image analysis error:', error);
        res.status(500).json({ error: 'Не удалось распознать фото: ' + error.message });
    }
});

// Endpoint для получения списка доступных моделей
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            }
        });
        const data = await response.json();
        const models = data.data.map(m => ({ id: m.id, name: m.name }));
        res.json({ models });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🍳 Шеф-повар (OpenRouter) запущен на порту ${PORT}`);
    console.log(`🤖 Текущая модель: ${MODEL}`);
});