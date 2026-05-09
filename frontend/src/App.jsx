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
      title: "Паста «Аль Френо»",
      messages: [
        { role: 'bot', text: "Привет! Я ваш ИИ-шеф. Что мы будем готовить сегодня?", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
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
        { role: 'bot', text: "Привет! Я готов анализировать ваши продукты. Пришлите фото или список ингредиентов.", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
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
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
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

    // Simulate AI Response
    setTimeout(() => {
      let botResponse = ""
      const text = userMessage.text.toLowerCase()

      const FULL_RECIPES = {
        pasta: "⏱ **Время:** 25 мин | 📊 **Сложность:** Легко | 👥 **Порции:** 2\n\n📋 **Пищевая ценность (на порцию):**\nКалории: 480 ккал | Белки: 18г | Жиры: 22г | Углеводы: 52г\n\n🛒 **Ингредиенты:**\n• Паста (спагетти или фетучини) — 200г\n• Сливки 20% — 150мл\n• Чеснок — 3 зубчика (мелко нарезать)\n• Сыр Пармезан — 50г (натереть на мелкой тёрке)\n• Оливковое масло Extra Virgin — 2 ст.л.\n• Сливочное масло — 15г\n• Свежая петрушка — небольшой пучок\n• Соль морская — по вкусу\n• Чёрный перец свежемолотый — по вкусу\n• Мускатный орех — щепотка\n\n👨‍🍳 **Пошаговое приготовление:**\n\n**Шаг 1 — Варка пасты (10 мин)**\nВскипятите 2л воды, посолите (1 ст.л. соли на литр). Опустите пасту и варите на 1 минуту меньше, чем указано на упаковке — она дойдёт в соусе.\n\n**Шаг 2 — Основа соуса (3 мин)**\nНа среднем огне разогрейте оливковое и сливочное масло в сковороде. Добавьте нарезанный чеснок и обжаривайте 1 минуту до золотистого цвета. Не пережарьте — чеснок станет горьким!\n\n**Шаг 3 — Сливочная база (5 мин)**\nВлейте сливки, добавьте мускатный орех. Доведите до лёгкого кипения, убавьте огонь. Добавьте 2/3 пармезана и мешайте до однородной массы.\n\n**Шаг 4 — Соединение (3 мин)**\nПереложите пасту в соус, добавьте 3-4 ст.л. воды от варки (крахмал загустит соус). Перемешивайте щипцами 1-2 минуты на среднем огне.\n\n**Шаг 5 — Подача**\nВыложите на тёплые тарелки, посыпьте оставшимся пармезаном и нарезанной петрушкой. Приправьте свежемолотым перцем.\n\n💡 **Совет шефа:** Никогда не промывайте пасту после варки — крахмал на её поверхности помогает соусу «прилипать». Вода от варки пасты — секретный ингредиент идеального соуса!\n\n🔄 **Вариации:** Добавьте обжаренные грибы, бекон или вяленые томаты для новых вкусов.",

        salad: "⏱ **Время:** 15 мин | 📊 **Сложность:** Очень легко | 👥 **Порции:** 2\n\n📋 **Пищевая ценность (на порцию):**\nКалории: 220 ккал | Белки: 4г | Жиры: 18г | Углеводы: 12г\n\n🛒 **Ингредиенты:**\n• Микс салатных листьев (руккола, шпинат, романо) — 150г\n• Огурец — 1 шт (средний)\n• Авокадо — 1 шт (спелый)\n• Черри томаты — 8-10 шт\n• Красный лук — 1/4 шт (тонкие полукольца)\n• Семечки подсолнуха или тыквы — 2 ст.л.\n\n**Для заправки:**\n• Оливковое масло Extra Virgin — 3 ст.л.\n• Лимонный сок — 1.5 ст.л.\n• Мёд жидкий — 1 ч.л.\n• Дижонская горчица — 0.5 ч.л.\n• Соль, перец — по вкусу\n\n👨‍🍳 **Пошаговое приготовление:**\n\n**Шаг 1 — Подготовка зелени (3 мин)**\nПромойте листья салата в холодной воде. Обсушите в салатной центрифуге или промокните полотенцем. Влажные листья разбавят заправку!\n\n**Шаг 2 — Нарезка овощей (5 мин)**\nОгурец нарежьте тонкими полукольцами. Черри разрежьте пополам. Лук нарежьте тончайшими полукольцами и замочите в холодной воде на 5 мин (уберёт горечь).\n\n**Шаг 3 — Авокадо (2 мин)**\nРазрежьте авокадо, удалите косточку. Нарежьте ломтиками прямо в кожуре, затем выложите ложкой. Сразу сбрызните лимонным соком, чтобы не потемнело.\n\n**Шаг 4 — Заправка (2 мин)**\nВ маленькой банке смешайте масло, лимонный сок, мёд и горчицу. Закройте крышкой и энергично потрясите 30 секунд. Посолите и поперчите.\n\n**Шаг 5 — Сборка и подача**\nВ большую миску выложите листья, сверху овощи и авокадо. Полейте заправкой непосредственно перед подачей. Посыпьте семечками.\n\n💡 **Совет шефа:** Заправляйте салат прямо перед подачей — листья быстро вянут от кислоты. Заправку можно приготовить заранее и хранить в холодильнике до 5 дней.\n\n🔄 **Вариации:** Добавьте сыр фета, креветки гриль или кусочки манго для тропической версии.",

        chicken: "⏱ **Время:** 40 мин (+ 15 мин маринад) | 📊 **Сложность:** Средне | 👥 **Порции:** 2\n\n📋 **Пищевая ценность (на порцию):**\nКалории: 380 ккал | Белки: 42г | Жиры: 12г | Углеводы: 24г\n\n🛒 **Ингредиенты:**\n• Куриное филе — 400г (2 грудки)\n• Соевый соус — 4 ст.л.\n• Мёд натуральный — 2 ст.л.\n• Имбирь свежий — 2 см корня (натереть)\n• Чеснок — 3 зубчика (измельчить)\n• Рисовый уксус — 1 ст.л.\n• Кунжутное масло — 1 ст.л.\n• Крахмал кукурузный — 1 ст.л.\n• Кунжут белый — 2 ст.л. (для подачи)\n• Зелёный лук — 2 пера (для подачи)\n• Растительное масло — 2 ст.л. (для жарки)\n\n**Для гарнира:**\n• Рис басмати — 150г\n• Вода — 300мл\n\n👨‍🍳 **Пошаговое приготовление:**\n\n**Шаг 1 — Маринад (15 мин)**\nНарежьте филе на кусочки 3×3 см. Смешайте соевый соус, мёд, тёртый имбирь, чеснок, рисовый уксус и кунжутное масло. Залейте курицу и оставьте минимум на 15 минут (лучше 30).\n\n**Шаг 2 — Рис (20 мин)**\nПромойте рис 3-4 раза до прозрачной воды. Залейте водой, доведите до кипения, убавьте огонь до минимума, накройте крышкой. Варите 15 минут, не открывая крышку.\n\n**Шаг 3 — Обжарка курицы (8 мин)**\nДостаньте курицу из маринада (маринад сохраните!). Обсушите бумажным полотенцем. Разогрейте масло в сковороде на сильном огне до лёгкого дымка. Выложите курицу в один слой. Жарьте по 3 минуты с каждой стороны до золотистой корочки.\n\n**Шаг 4 — Соус терияки (5 мин)**\nРазведите крахмал в 2 ст.л. холодной воды. Влейте оставшийся маринад в сковороду с курицей. Добавьте крахмальную смесь. Помешивайте на среднем огне 2-3 минуты, пока соус не загустеет и не станет глянцевым.\n\n**Шаг 5 — Подача**\nВыложите рис на тарелку, сверху — курицу в соусе. Посыпьте кунжутом и нарезанным зелёным луком.\n\n💡 **Совет шефа:** Обсушивайте курицу перед жаркой — влага мешает образованию корочки. Сковорода должна быть очень горячей, чтобы получить карамелизацию, а не тушение.\n\n🔄 **Вариации:** Замените курицу на лосось или тофу. Добавьте брокколи или болгарский перец в последние 3 минуты готовки.",

        cupcakes: "⏱ **Время:** 7 мин | 📊 **Сложность:** Элементарно | 👥 **Порции:** 1\n\n📋 **Пищевая ценность (на порцию):**\nКалории: 340 ккал | Белки: 8г | Жиры: 14г | Углеводы: 46г\n\n🛒 **Ингредиенты:**\n• Мука пшеничная — 3 ст.л. (с горкой)\n• Какао-порошок — 1.5 ст.л.\n• Сахар — 2 ст.л.\n• Разрыхлитель — 1/4 ч.л.\n• Щепотка соли\n• Яйцо — 1 шт\n• Молоко — 2 ст.л.\n• Растительное масло — 1 ст.л.\n• Ванильный экстракт — 1/4 ч.л.\n• Шоколадные капли — 1 ст.л. (по желанию)\n\n👨‍🍳 **Пошаговое приготовление:**\n\n**Шаг 1 — Сухая смесь (1 мин)**\nВозьмите большую керамическую кружку (300мл+). Насыпьте муку, какао, сахар, разрыхлитель и соль. Перемешайте вилкой до однородности.\n\n**Шаг 2 — Жидкие ингредиенты (1 мин)**\nДобавьте яйцо, молоко, масло и ваниль. Тщательно перемешайте вилкой, разбивая все комочки. Масса должна быть гладкой. Вмешайте шоколадные капли.\n\n**Шаг 3 — Микроволновка (2-3 мин)**\nПоставьте кружку в микроволновку на 800Вт на 2 минуты 30 секунд. Кекс поднимется выше края — это нормально. Если центр ещё жидкий — добавьте 15-20 секунд.\n\n**Шаг 4 — Отдых и подача (2 мин)**\nДостаньте кружку (осторожно, горячая!). Дайте постоять 1-2 минуты. По желанию добавьте сверху шарик мороженого, взбитые сливки или ягоды.\n\n💡 **Совет шефа:** Не перемешивайте тесто слишком долго — кекс станет «резиновым». Используйте кружку без металлического декора! Кекс лучше слегка недопечь, чем пересушить.\n\n🔄 **Вариации:** Замените какао на матчу для зелёного кекса, добавьте арахисовую пасту (1 ст.л.) для орехового вкуса, или положите внутрь кусочек шоколада для жидкой серединки."
      }

      if (userMessage.image) {
        botResponse = "### Результат анализа Шеф-ИИ 🔍\nНа вашем фото я успешно определил продукты: **куриная грудка, томаты и сыр**.\n\nРекомендую: **Курица «Капрезе»**\n⏱ **Время:** 30 мин | 📊 **Сложность:** Легко\n\n1. Сделайте надрезы в курице.\n2. Вложите помидоры и сыр.\n3. Запекайте 25 минут при 200°C.\n\nХотите более подробную инструкцию?"
      } else if (text.includes("паст")) {
        botResponse = `Конечно! Вот подробный рецепт:\n\n### ${FULL_RECIPES.pasta}`
      } else if (text.includes("салат")) {
        botResponse = `Без проблем! Вот рецепт:\n\n### ${FULL_RECIPES.salad}`
      } else if (text.includes("куриц") || text.includes("терияк")) {
        botResponse = `Вот как это приготовить:\n\n### ${FULL_RECIPES.chicken}`
      } else if (text.includes("кекс")) {
        botResponse = `Сладкое за 5 минут — это реально:\n\n### ${FULL_RECIPES.cupcakes}`
      } else {
        botResponse = "Интересный вопрос! С точки зрения кулинарии, это можно использовать как основу для соуса или маринада. Рассказать подробнее?"
      }

      const botMsg = {
        role: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }

      setChats(prev => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMsg] } : chat
      ))
      setIsLoading(false)
    }, 1500)
  }

  const PREDEFINED_RECIPES = [
    { id: 'pasta', icon: '🍝', title: 'Паста Аль Френо', desc: 'Сливочный соус и сыр' },
    { id: 'salad', icon: '🥗', title: 'Фреш-Салат', desc: 'Легкий и витаминный' },
    { id: 'chicken', icon: '🍗', title: 'Курица Терияки', desc: 'Азиатская классика' },
    { id: 'cupcakes', icon: '🧁', title: 'Быстрые кексы', desc: 'Сладкое за 5 минут' }
  ]

  const handleSuggestionClick = (title) => {
    setInputVal(`Расскажи рецепт: ${title}`)
    // Автоматическая отправка через небольшой delay для UX
    setTimeout(() => {
      document.querySelector('.submit-btn').click()
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
            <h1>Culinary AI</h1>
          </div>
          <div className="header-status">
            <div className="glass-pill">
              <span style={{color: '#4ade80'}}>●</span> ИИ Активен
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
                  <div className="message-text" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
                  <div style={{fontSize: '0.7rem', opacity: 0.5, marginTop: '5px', textAlign: 'right'}}>
                    {msg.time}
                  </div>
                </div>
              ))}
              
              {/* Популярные идеи - показываем только в начале чата */}
              {activeChat?.messages.length === 1 && !isLoading && (
                <div className="suggestions-grid animate-slide-up">
                  <p className="suggestions-hint">Попробуйте одну из популярных идей:</p>
                  <div className="recipe-cards mini">
                    {PREDEFINED_RECIPES.map(item => (
                      <div key={item.id} className="recipe-card glass-panel" onClick={() => handleSuggestionClick(item.title)}>
                        <div className="recipe-icon" style={{fontSize: '1.5rem', width: '40px', height: '40px'}}>{item.icon}</div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <h3 style={{fontSize: '0.9rem'}}>{item.title}</h3>
                          <p style={{fontSize: '0.7rem'}}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="message bot typing-indicator">
                  Шеф-ИИ печатает... <div className="spinner" style={{width: '12px', height: '12px'}}></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              <div className="chat-box glass-panel">
                {imagePreview && (
                  <div className="image-preview-wrapper" style={{padding: '10px 0'}}>
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button className="remove-image-btn" onClick={() => {setSelectedImage(null); setImagePreview(null)}}>✕</button>
                    </div>
                  </div>
                )}
                <textarea 
                  className="chat-input" 
                  placeholder="Задайте вопрос ИИ-шефу..."
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
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{display: 'none'}} 
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
                    {isLoading ? <div className="spinner"></div> : 'Отправить ↗'}
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
