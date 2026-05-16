import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [inputVal, setInputVal] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Chat History States
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "Новый рецепт",
      messages: [
        { role: 'bot', text: "Привет! Я ваш ИИ-шеф на базе Gemini. Что мы будем готовить сегодня? Просто напишите блюдо или пришлите фото продуктов!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    }
  ])
  const [activeChatId, setActiveChatId] = useState(1)

  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeChat?.messages, isLoading])

  // Проверка связи с бэкендом
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: 'тест' })
        });
        const data = await response.json();
        console.log('✅ Бэкенд Gemini работает!');
      } catch (error) {
        console.error('❌ Бэкенд не запущен! Запусти: node server.js в папке backend');
      }
    };
    checkBackend();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current.click()
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const createNewChat = () => {
    const newId = Date.now()
    const newChat = {
      id: newId,
      title: "Новый рецепт",
      messages: [
        { role: 'bot', text: "Привет! Я готов анализировать ваши продукты. Пришлите фото или список ингредиентов.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    }
    setChats([newChat, ...chats])
    setActiveChatId(newId)
  }

  const handleSendMessage = async () => {
    if (!inputVal.trim() && !selectedImage) return

    const userMessage = {
      role: 'user',
      text: inputVal,
      image: imagePreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Update current chat with user message
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstMessage = chat.messages.length <= 1;
        return {
          ...chat,
          title: isFirstMessage ? (inputVal.slice(0, 25) || "Рецепт по фото") : chat.title,
          messages: [...chat.messages, userMessage]
        }
      }
      return chat
    })

    setChats(updatedChats)
    setInputVal('')
    setSelectedImage(null)
    setImagePreview(null)
    setIsLoading(true)

    // Реальный запрос к Gemini
    try {
      let response;

      if (selectedImage) {
        // Если есть фото - отправляем на анализ
        response = await fetch('http://localhost:3001/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: imagePreview })
        });
      } else {
        // Обычный текстовый запрос рецепта
        response = await fetch('http://localhost:3001/api/recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: inputVal })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      const botMsg = {
        role: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, botMsg] }
          : chat
      ));

    } catch (error) {
      console.error('API Error:', error);

      const errorMsg = {
        role: 'bot',
        text: `❌ **Ошибка подключения к шеф-повару Gemini**\n\n${error.message}\n\n**Решение:**\n1. Открой новый терминал\n2. Перейди в папку backend: \`cd C:\\Projects\\food\\backend\`\n3. Запусти сервер: \`node server.js\`\n\nПосле запуска сервера обнови страницу и попробуй снова!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, errorMsg] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  }

  const PREDEFINED_RECIPES = [
    { id: 'pasta', icon: '🍝', title: 'Паста Карбонара', desc: 'Классическая итальянская паста' },
    { id: 'salad', icon: '🥗', title: 'Греческий салат', desc: 'Свежий и полезный' },
    { id: 'chicken', icon: '🍗', title: 'Курица по-французски', desc: 'Нежная и сочная' },
    { id: 'soup', icon: '🥣', title: 'Тыквенный суп', desc: 'Сливочный и ароматный' }
  ]

  const handleSuggestionClick = (title) => {
    setInputVal(`Дай рецепт: ${title}`)
    setTimeout(() => {
      document.querySelector('.submit-btn')?.click()
    }, 100)
  }

  return (
    <div className="app-wrapper">
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      <div className="app-container">
        <header className="header">
          <div className="logo">
            <span>🍳</span>
            <h1>Culinary AI — Gemini</h1>
          </div>
          <div className="header-status">
            <div className="glass-pill">
              <span style={{ color: '#4ade80' }}>●</span> Gemini AI Активен
            </div>
          </div>
        </header>

        <main className="main-content">
          {/* Sidebar - Chat History */}
          <aside className="sidebar">
            <button className="new-chat-btn" onClick={createNewChat}>
              <span>+</span> Новый чат
            </button>
            <div className="history-list">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  className={`history-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Chat Area */}
          <section className="chat-area">
            <div className="messages-list">
              {activeChat?.messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  {msg.image && <img src={msg.image} alt="User upload" className="message-image" />}
                  <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px', textAlign: 'right' }}>
                    {msg.time}
                  </div>
                </div>
              ))}

              {/* Популярные идеи - показываем только в начале чата */}
              {activeChat?.messages.length === 1 && !isLoading && (
                <div className="suggestions-grid animate-slide-up">
                  <p className="suggestions-hint">🍽️ Попробуйте попросить рецепт:</p>
                  <div className="recipe-cards mini">
                    {PREDEFINED_RECIPES.map(item => (
                      <div key={item.id} className="recipe-card glass-panel" onClick={() => handleSuggestionClick(item.title)}>
                        <div className="recipe-icon" style={{ fontSize: '1.5rem', width: '40px', height: '40px' }}>{item.icon}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: '0.9rem' }}>{item.title}</h3>
                          <p style={{ fontSize: '0.7rem' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="message bot typing-indicator">
                  🤖 Gemini шеф обдумывает рецепт... <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              <div className="chat-box glass-panel">
                {imagePreview && (
                  <div className="image-preview-wrapper" style={{ padding: '10px 0' }}>
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button className="remove-image-btn" onClick={() => { setSelectedImage(null); setImagePreview(null) }}>✕</button>
                    </div>
                  </div>
                )}
                <textarea
                  className="chat-input"
                  placeholder="Например: рецепт борща, как приготовить пиццу, или пришли фото продуктов..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                ></textarea>

                <div className="chat-actions">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    <button className="action-btn" title="Прикрепить фото" onClick={handleImageClick}>
                      📷
                    </button>
                  </div>

                  <button
                    className="submit-btn"
                    onClick={handleSendMessage}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="spinner"></div> : 'Отправить →'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App