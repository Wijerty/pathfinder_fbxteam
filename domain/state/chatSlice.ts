// Chat Slice для управления чатом и ИИ-взаимодействием
import { StateCreator } from 'zustand'
import { ChatMessage, ChatSession, AIRecommendation } from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'

// Состояние чата
export interface ChatState {
  // Сессии
  sessions: ChatSession[]
  activeSessionId: string | null
  currentSession: ChatSession | null
  
  // Сообщения текущей сессии
  messages: ChatMessage[]
  
  // Состояние ввода и обработки
  isTyping: boolean
  isStreaming: boolean
  isRecording: boolean
  isSpeaking: boolean
  
  // Голосовое взаимодействие
  lastTranscription: string | null
  supportsTTS: boolean
  supportsSTT: boolean
  
  // ИИ рекомендации и действия
  pendingRecommendations: AIRecommendation[]
  suggestedActions: Array<{
    id: string
    type: 'skill_add' | 'course_enroll' | 'quest_accept' | 'profile_update'
    title: string
    description: string
    data: any
    confidence: number
  }>
  
  // Контекст и персонализация
  currentContext: 'employee' | 'hr' | 'admin' | 'general'
  contextData: Record<string, any>
  
  // Настройки
  settings: {
    enableVoice: boolean
    enableNotifications: boolean
    autoApplySuggestions: boolean
    responseSpeed: 'fast' | 'detailed'
  }
  
  // Состояние загрузки и ошибки
  isLoading: boolean
  error: string | null
}

// Действия чата
export interface ChatActions {
  // Управление сессиями
  createSession: (context?: string) => Promise<string>
  loadSessions: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  clearHistory: () => Promise<void>
  
  // Отправка сообщений
  sendMessage: (content: string, metadata?: any) => Promise<void>
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>
  resendMessage: (messageId: string) => Promise<void>
  
  // Голосовое взаимодействие
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string>
  startSpeaking: (text: string) => Promise<void>
  stopSpeaking: () => void
  
  // Обработка рекомендаций
  applyRecommendation: (recommendationId: string) => Promise<void>
  dismissRecommendation: (recommendationId: string) => void
  applySuggestedAction: (actionId: string) => Promise<void>
  dismissSuggestedAction: (actionId: string) => void
  
  // Контекст
  setContext: (context: string, data?: any) => void
  updateContextData: (data: Record<string, any>) => void
  
  // Настройки
  updateSettings: (settings: Partial<ChatState['settings']>) => void
  
  // Утилиты
  clearError: () => void
  refreshChat: () => Promise<void>
}

// Полный тип слайса
export type ChatSlice = ChatState & ChatActions

// Начальное состояние
const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  currentSession: null,
  messages: [],
  
  isTyping: false,
  isStreaming: false,
  isRecording: false,
  isSpeaking: false,
  
  lastTranscription: null,
  supportsTTS: false,
  supportsSTT: false,
  
  pendingRecommendations: [],
  suggestedActions: [],
  
  currentContext: 'general',
  contextData: {},
  
  settings: {
    enableVoice: true,
    enableNotifications: true,
    autoApplySuggestions: false,
    responseSpeed: 'fast'
  },
  
  isLoading: false,
  error: null
}

// Создание chat slice
export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  ...initialState,

  // === УПРАВЛЕНИЕ СЕССИЯМИ ===

  createSession: async (context: string = 'general') => {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const newSession: ChatSession = {
        id: sessionId,
        userId: 'current-user', // TODO: получить ID текущего пользователя
        context: context as any,
        messages: [],
        isActive: true,
        startedAt: new Date(),
        lastMessageAt: new Date()
      }

      // Создаем системное приветственное сообщение
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Привет! Я ваш ИИ-помощник по карьере. Как дела?',
        timestamp: new Date()
      }

      newSession.messages = [welcomeMessage]

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      })

      if (!response.ok) throw new Error('Не удалось создать сессию')

      set({
        sessions: [...get().sessions, newSession],
        activeSessionId: sessionId,
        currentSession: newSession,
        messages: newSession.messages,
        currentContext: context as any,
        contextData: {}
      })

      return sessionId

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания сессии'
      set({ error: errorMessage })
      throw error
    }
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch('/api/chat/sessions')
      if (!response.ok) throw new Error('Не удалось загрузить сессии')

      const sessions: ChatSession[] = await response.json()
      
      set({ 
        sessions,
        isLoading: false 
      })

      // Если нет активной сессии, создаем новую
      if (sessions.length === 0) {
        await get().createSession()
      } else if (!get().activeSessionId) {
        const lastSession = sessions[0]
        await get().switchSession(lastSession.id)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки сессий'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
    }
  },

  switchSession: async (sessionId: string) => {
    try {
      const { sessions } = get()
      const session = sessions.find(s => s.id === sessionId)
      
      if (!session) throw new Error('Сессия не найдена')

      set({
        activeSessionId: sessionId,
        currentSession: session,
        messages: session.messages,
        currentContext: session.context,
        contextData: {}
      })

      // TODO: Загружаем контекстные данные для сессии
      // await get().loadContextData(session.context)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка переключения сессии'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Не удалось удалить сессию')

      const { sessions, activeSessionId } = get()
      const filteredSessions = sessions.filter(s => s.id !== sessionId)

      set({ sessions: filteredSessions })

      // Если удалили активную сессию, переключаемся на другую
      if (activeSessionId === sessionId) {
        if (filteredSessions.length > 0) {
          await get().switchSession(filteredSessions[0].id)
        } else {
          await get().createSession()
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления сессии'
      set({ error: errorMessage })
      throw error
    }
  },

  clearHistory: async () => {
    try {
      const { activeSessionId } = get()
      if (!activeSessionId) return

      const response = await fetch(`/api/chat/sessions/${activeSessionId}/clear`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Не удалось очистить историю')

      // Добавляем приветственное сообщение
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Добро пожаловать! Чем могу помочь?',
        timestamp: new Date()
      }

      set({ messages: [welcomeMessage] })

      // Обновляем сессию
      const sessions = get().sessions.map(session => 
        session.id === activeSessionId 
          ? { ...session, messages: [welcomeMessage] }
          : session
      )

      set({ 
        sessions,
        currentSession: sessions.find(s => s.id === activeSessionId) || null
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка очистки истории'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ОТПРАВКА СООБЩЕНИЙ ===

  sendMessage: async (content: string, metadata: any = {}) => {
    try {
      const { activeSessionId, currentContext, contextData } = get()
      
      if (!activeSessionId) {
        await get().createSession()
      }

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        metadata: {
          ...metadata,
          context: currentContext,
          voiceInput: false
        },
        timestamp: new Date()
      }

      // Добавляем сообщение пользователя
      set({
        messages: [...get().messages, userMessage],
        isTyping: false
      })

      // TODO: Обновляем сессию
      // get().updateCurrentSession([...get().messages])

      // Показываем индикатор стриминга
      set({ isStreaming: true })

      // Отправляем в API
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: currentContext,
          contextData,
          sessionId: activeSessionId,
          history: get().messages.slice(-10) // Последние 10 сообщений
        })
      })

      if (!response.ok) throw new Error('Ошибка ответа ИИ')

      // TODO: Обрабатываем стриминговый ответ
      // await get().handleStreamingResponse(response)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки сообщения'
      
      // Добавляем сообщение об ошибке
      const errorMessage_obj: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Извините, произошла ошибка: ${errorMessage}`,
        metadata: { isError: true },
        timestamp: new Date()
      }

      set({
        messages: [...get().messages, errorMessage_obj],
        isStreaming: false,
        error: errorMessage
      })
    }
  },

  sendVoiceMessage: async (audioBlob: Blob) => {
    try {
      set({ isLoading: true })

      // Транскрибируем аудио
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const transcriptionResponse = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      })

      if (!transcriptionResponse.ok) throw new Error('Ошибка транскрипции')

      const { text } = await transcriptionResponse.json()
      
      set({ 
        lastTranscription: text,
        isLoading: false 
      })

      // Публикуем событие распознавания голоса
      await publish(createEvent(
        'VOICE_COMMAND_PARSED',
        {
          userId: 'current-user', // TODO: получить ID текущего пользователя
          sessionId: get().activeSessionId,
          audioText: text,
          parsedIntent: {
            action: 'message',
            entities: {},
            confidence: 0.9
          },
          commandResult: 'success'
        },
        'current-user' // TODO: получить ID текущего пользователя
      ))

      // Отправляем как обычное сообщение
      await get().sendMessage(text, { voiceInput: true })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка голосового сообщения'
      set({ 
        isLoading: false,
        error: errorMessage 
      })
      throw error
    }
  },

  resendMessage: async (messageId: string) => {
    try {
      const { messages } = get()
      const messageIndex = messages.findIndex(m => m.id === messageId)
      
      if (messageIndex === -1 || messages[messageIndex].role !== 'user') {
        throw new Error('Сообщение для повтора не найдено')
      }

      const message = messages[messageIndex]
      
      // Удаляем последующие сообщения
      const newMessages = messages.slice(0, messageIndex)
      set({ messages: newMessages })

      // Отправляем заново
      await get().sendMessage(message.content, message.metadata)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка повтора сообщения'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ГОЛОСОВОЕ ВЗАИМОДЕЙСТВИЕ ===

  startRecording: async () => {
    try {
      // Проверяем поддержку браузера
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Браузер не поддерживает запись аудио')
      }

      set({ isRecording: true, error: null })

      // Здесь будет логика начала записи
      // Пока просто устанавливаем флаг

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка начала записи'
      set({ 
        isRecording: false,
        error: errorMessage 
      })
      throw error
    }
  },

  stopRecording: async () => {
    try {
      set({ isRecording: false })

      // Здесь будет логика остановки записи и получения аудио
      // Пока возвращаем заглушку
      return 'Транскрипция записи'

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка остановки записи'
      set({ error: errorMessage })
      throw error
    }
  },

  startSpeaking: async (text: string) => {
    try {
      if (!get().supportsTTS) {
        console.warn('TTS не поддерживается')
        return
      }

      set({ isSpeaking: true })

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error('Ошибка синтеза речи')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audio.onended = () => {
        set({ isSpeaking: false })
        URL.revokeObjectURL(audioUrl)
      }
      
      await audio.play()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка воспроизведения'
      set({ 
        isSpeaking: false,
        error: errorMessage 
      })
      throw error
    }
  },

  stopSpeaking: () => {
    set({ isSpeaking: false })
    // Здесь будет логика остановки воспроизведения
  },

  // === РЕКОМЕНДАЦИИ И ДЕЙСТВИЯ ===

  applyRecommendation: async (recommendationId: string) => {
    try {
      const { pendingRecommendations } = get()
      const recommendation = pendingRecommendations.find(r => r.id === recommendationId)
      
      if (!recommendation) throw new Error('Рекомендация не найдена')

      // Публикуем событие применения рекомендации
      await publish(createEvent(
        'AI_RECOMMENDATION_ACCEPTED',
        {
          userId: 'current-user', // TODO: получить ID текущего пользователя
          recommendationId,
          acceptedAt: new Date(),
          actionsTaken: [recommendation.type]
        },
        'current-user' // TODO: получить ID текущего пользователя
      ))

      // Удаляем из ожидающих
      set({
        pendingRecommendations: pendingRecommendations.filter(r => r.id !== recommendationId)
      })

      // Добавляем сообщение о применении
      const confirmationMessage: ChatMessage = {
        id: `msg-${Date.now()}-confirm`,
        role: 'assistant',
        content: `✅ Рекомендация "${recommendation.title}" применена успешно!`,
        timestamp: new Date()
      }

      set({
        messages: [...get().messages, confirmationMessage]
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка применения рекомендации'
      set({ error: errorMessage })
      throw error
    }
  },

  dismissRecommendation: (recommendationId: string) => {
    const { pendingRecommendations } = get()
    
    set({
      pendingRecommendations: pendingRecommendations.filter(r => r.id !== recommendationId)
    })

    // Публикуем событие отклонения
    publish(createEvent(
      'AI_RECOMMENDATION_REJECTED',
      {
        userId: 'current-user', // TODO: получить ID текущего пользователя
        recommendationId,
        rejectedAt: new Date()
      },
      'current-user' // TODO: получить ID текущего пользователя
    ))
  },

  applySuggestedAction: async (actionId: string) => {
    try {
      const { suggestedActions } = get()
      const action = suggestedActions.find(a => a.id === actionId)
      
      if (!action) throw new Error('Действие не найдено')

      // Публикуем событие применения действия
      await publish(createEvent(
        'CHAT_SUGGESTION_APPLIED',
        {
          userId: 'current-user', // TODO: получить ID текущего пользователя
          sessionId: get().activeSessionId,
          messageId: actionId,
          suggestionType: action.type,
          suggestionData: action.data,
          appliedAt: new Date(),
          resultingEvents: []
        },
        'current-user' // TODO: получить ID текущего пользователя
      ))

      // Удаляем из предложенных
      set({
        suggestedActions: suggestedActions.filter(a => a.id !== actionId)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка применения действия'
      set({ error: errorMessage })
      throw error
    }
  },

  dismissSuggestedAction: (actionId: string) => {
    const { suggestedActions } = get()
    
    set({
      suggestedActions: suggestedActions.filter(a => a.id !== actionId)
    })
  },

  // === КОНТЕКСТ ===

  setContext: (context: string, data: any = {}) => {
    set({
      currentContext: context as any,
      contextData: data
    })
  },

  updateContextData: (data: Record<string, any>) => {
    set({
      contextData: {
        ...get().contextData,
        ...data
      }
    })
  },

  // === НАСТРОЙКИ ===

  updateSettings: (settings: Partial<ChatState['settings']>) => {
    set({
      settings: {
        ...get().settings,
        ...settings
      }
    })

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pathfinder_chat_settings', JSON.stringify(get().settings))
    }
  },

  // === УТИЛИТЫ ===

  clearError: () => {
    set({ error: null })
  },

  refreshChat: async () => {
    await get().loadSessions()
  },

  // Приватные методы
  getCurrentUserId: () => {
    return 'current-user-id' // Заглушка
  },

  getWelcomeMessage: (context: string) => {
    const messages = {
      employee: 'Привет! Я ваш AI-ассистент по развитию карьеры. Могу помочь с навыками, курсами и карьерными целями.',
      hr: 'Здравствуйте! Я помогу с подбором кандидатов, анализом профилей и рекомендациями по вакансиям.',
      admin: 'Добро пожаловать! Я помогу с управлением системой, настройкой таксономии и аналитикой.',
      general: 'Привет! Я PathFinder AI. Чем могу помочь?'
    }
    
    return messages[context as keyof typeof messages] || messages.general
  },

  updateCurrentSession: (messages: ChatMessage[]) => {
    const { sessions, activeSessionId } = get()
    
    if (!activeSessionId) return

    const updatedSessions = sessions.map(session => 
      session.id === activeSessionId 
        ? { 
            ...session, 
            messages,
            lastMessageAt: new Date()
          }
        : session
    )

    const currentSession = updatedSessions.find(s => s.id === activeSessionId)

    set({ 
      sessions: updatedSessions,
      currentSession: currentSession || null
    })
  },

  loadContextData: async (context: string) => {
    try {
      // Загружаем контекстные данные в зависимости от контекста
      switch (context) {
        case 'employee':
          // Загружаем данные профиля, квестов, рекомендаций
          break
        case 'hr':
          // Загружаем данные по вакансиям и кандидатам
          break
        case 'admin':
          // Загружаем системную аналитику
          break
      }
    } catch (error) {
      console.error('Ошибка загрузки контекстных данных:', error)
    }
  },

  handleStreamingResponse: async (response: Response) => {
    try {
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Не удалось получить поток ответа')

      let assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      // Добавляем пустое сообщение ассистента
      set({
        messages: [...get().messages, assistantMessage]
      })

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk

        // Обновляем сообщение ассистента
        assistantMessage.content = accumulatedContent

        const currentMessages = get().messages
        const updatedMessages = [
          ...currentMessages.slice(0, -1),
          assistantMessage
        ]

        set({ messages: updatedMessages })
      }

      // TODO: Парсим потенциальные действия из ответа
      // get().parseActionsFromResponse(accumulatedContent)

      set({ isStreaming: false })

      // TODO: Обновляем сессию
      // get().updateCurrentSession(get().messages)

    } catch (error) {
      console.error('Ошибка обработки стримингового ответа:', error)
      set({ isStreaming: false })
    }
  },

  parseActionsFromResponse: (content: string) => {
    // Ищем предложения действий в ответе ИИ
    // Например, по ключевым словам или специальным маркерам
    const actionPatterns = [
      /добавить навык "(.+?)"/gi,
      /записаться на курс "(.+?)"/gi,
      /принять квест "(.+?)"/gi
    ]

    const suggestedActions: any[] = []

    actionPatterns.forEach((pattern, index) => {
      const matches = content.matchAll(pattern)
      for (const match of Array.from(matches)) {
        const actionTypes = ['skill_add', 'course_enroll', 'quest_accept']
        
        suggestedActions.push({
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: actionTypes[index],
          title: match[1],
          description: `Применить: ${match[0]}`,
          data: { value: match[1] },
          confidence: 0.8
        })
      }
    })

    if (suggestedActions.length > 0) {
      set({
        suggestedActions: [...get().suggestedActions, ...suggestedActions]
      })
    }
  }
})

// === СЕЛЕКТОРЫ ===

export const chatSelectors = {
  // Сессии
  getSessions: (state: ChatSlice) => state.sessions,
  getCurrentSession: (state: ChatSlice) => state.currentSession,
  getActiveSessionId: (state: ChatSlice) => state.activeSessionId,
  
  // Сообщения
  getMessages: (state: ChatSlice) => state.messages,
  getLastMessage: (state: ChatSlice) => state.messages[state.messages.length - 1],
  getLastUserMessage: (state: ChatSlice) => 
    state.messages.filter(m => m.role === 'user').pop(),
  getLastAssistantMessage: (state: ChatSlice) => 
    state.messages.filter(m => m.role === 'assistant').pop(),
  
  // Состояние
  isTyping: (state: ChatSlice) => state.isTyping,
  isStreaming: (state: ChatSlice) => state.isStreaming,
  isRecording: (state: ChatSlice) => state.isRecording,
  isSpeaking: (state: ChatSlice) => state.isSpeaking,
  isLoading: (state: ChatSlice) => state.isLoading,
  getError: (state: ChatSlice) => state.error,
  
  // Голос
  getLastTranscription: (state: ChatSlice) => state.lastTranscription,
  supportsTTS: (state: ChatSlice) => state.supportsTTS,
  supportsSTT: (state: ChatSlice) => state.supportsSTT,
  
  // Рекомендации
  getPendingRecommendations: (state: ChatSlice) => state.pendingRecommendations,
  getSuggestedActions: (state: ChatSlice) => state.suggestedActions,
  hasRecommendations: (state: ChatSlice) => 
    state.pendingRecommendations.length > 0 || state.suggestedActions.length > 0,
  
  // Контекст
  getCurrentContext: (state: ChatSlice) => state.currentContext,
  getContextData: (state: ChatSlice) => state.contextData,
  
  // Настройки
  getSettings: (state: ChatSlice) => state.settings,
  isVoiceEnabled: (state: ChatSlice) => state.settings.enableVoice,
  
  // Производные данные
  getMessageCount: (state: ChatSlice) => state.messages.length,
  getSessionStats: (state: ChatSlice) => ({
    total: state.sessions.length,
    active: state.sessions.filter(s => s.isActive).length,
    contexts: Array.from(new Set(state.sessions.map(s => s.context))).length
  }),
  
  getRecentSessions: (limit: number = 5) => (state: ChatSlice) =>
    state.sessions
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
      .slice(0, limit)
}
