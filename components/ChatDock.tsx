'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { VoiceToggle } from './VoiceToggle'
import { ChatMessage as ChatMessageType, UserRole } from '@/types'
import { getServices, serviceHelpers } from '@/services'
import { MessageSquare, Send, Minimize2, Maximize2, Bot, User, Mic, MicOff } from 'lucide-react'

interface ChatDockProps {
  userId: string
  userRole: UserRole
  context: 'employee' | 'hr' | 'admin' | 'general'
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function ChatDock({ 
  userId, 
  userRole, 
  context, 
  isOpen, 
  onToggle, 
  className = '' 
}: ChatDockProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const services = getServices()

  // Автопрокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Инициализация чата с приветственным сообщением
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = getWelcomeMessage(context, userRole)
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        metadata: { context }
      }])
    }
  }, [context, userRole, messages.length])

  const getWelcomeMessage = (context: string, role: UserRole): string => {
    const messages = {
      employee: 'Привет! Я ваш ИИ-помощник. Могу помочь с развитием карьеры, поиском курсов, планированием обучения и ответить на вопросы о навыках. Что вас интересует?',
      hr: 'Здравствуйте! Я помогу с поиском кандидатов, анализом навыков команды, составлением требований к ролям и оценкой совместимости. Чем могу быть полезен?',
      admin: 'Добро пожаловать! Помогу с управлением таксономией, анализом метрик, настройкой системы и выявлением трендов. Какую задачу решаем?',
      general: 'Привет! Я ваш ИИ-консультант PathFinder. Готов помочь с любыми вопросами по развитию, поиску и управлению талантами.'
    }
    
    return messages[context as keyof typeof messages] || messages.general
  }

  const handleSendMessage = async (content: string, isVoice: boolean = false) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      metadata: { 
        voiceInput: isVoice,
        context
      }
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Создаем сообщение ассистента для стрима
    const assistantId = `assistant-${Date.now()}`
    const assistantMessage: ChatMessageType = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      metadata: { 
        context,
        recommendations: [],
        skills: [],
        roles: []
      }
    }

    setMessages(prev => [...prev, assistantMessage])

    // Создаем AbortController для остановки стрима с увеличенным таймаутом
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 65000) // 65 секунд - чуть больше чем в API
    setAbortController(controller)

    try {
      // Получаем стрим от LLM
      const llmMessages = [...messages, userMessage].map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))

      // Импортируем chatStream
      const { chatStream } = await import('@/services/llmClient')
      
      let fullContent = ''
      for await (const token of chatStream(llmMessages, context)) {
        // Проверяем отмену
        if (controller.signal.aborted) {
          break
        }
        
        fullContent += token
        
        // Обновляем сообщение в реальном времени
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, content: fullContent }
            : msg
        ))
        
        // Небольшая задержка для плавности
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      // Начисляем XP за активность в чате
      await serviceHelpers.awardActionXP(userId, 'chat_interaction', 5)

    } catch (error) {
      console.error('Ошибка чата:', error)
      
      let errorContent = 'Извините, произошла ошибка. Попробуйте позже или переформулируйте вопрос.'
      
      // Более специфичные сообщения об ошибках
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          errorContent = 'Запрос занял слишком много времени. Попробуйте сократить вопрос или повторить попытку.'
        } else if (error.message.includes('не доступен') || error.message.includes('unavailable')) {
          errorContent = 'Сервис временно недоступен. Пожалуйста, попробуйте позже.'
        } else if (error.message.includes('API error')) {
          errorContent = 'Ошибка подключения к AI сервису. Проверьте подключение к интернету.'
        } else if (error.message.includes('AbortError')) {
          errorContent = 'Запрос был отменен. Попробуйте еще раз.'
        }
      }
      
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        metadata: { context, isError: true }
      }

      // Заменяем пустое сообщение ассистента на ошибку
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId ? errorMessage : msg
      ))
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const handleVoiceInput = async (transcription: string) => {
    if (transcription.trim()) {
      await handleSendMessage(transcription, true)
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getContextBadgeColor = (context: string) => {
    const colors = {
      employee: 'bg-blue-100 text-blue-800',
      hr: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[context as keyof typeof colors] || colors.general
  }

  const getContextTitle = (context: string) => {
    const titles = {
      employee: 'Карьерный консультант',
      hr: 'HR Аналитик',
      admin: 'Системный консультант',
      general: 'ИИ Помощник'
    }
    return titles[context as keyof typeof titles] || titles.general
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 ${className}`}
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 h-96 shadow-xl z-50 flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{getContextTitle(context)}</CardTitle>
              <Badge variant="outline" className={`text-xs ${getContextBadgeColor(context)}`}>
                {context.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggle}
              className="h-8 w-8"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 overflow-hidden p-4 pt-0">
            <div className="h-full overflow-y-auto space-y-4 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] p-3 rounded-lg text-sm chat-message ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.metadata?.isError ? 'bg-red-100 text-red-800' : ''}`}>
                      {message.content}
                      {message.metadata?.voiceInput && (
                        <Mic className="inline-block ml-2 h-3 w-3 opacity-60" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="flex-shrink-0 p-4 pt-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isVoiceMode ? "Говорите или печатайте..." : "Напишите сообщение..."}
                  disabled={isLoading}
                  className="pr-12"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceToggle
                    onTranscription={handleVoiceInput}
                    disabled={isLoading}
                    size="sm"
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
