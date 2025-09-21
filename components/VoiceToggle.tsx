'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { getVoiceManager } from '@/services/sttClient'
import { getSpeechManager } from '@/services/ttsClient'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceToggleProps {
  onTranscription?: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function VoiceToggle({ 
  onTranscription, 
  onError, 
  disabled = false,
  size = 'default',
  className = ''
}: VoiceToggleProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [sttAvailable, setSTTAvailable] = useState(false)
  const [ttsAvailable, setTTSAvailable] = useState(false)
  
  const voiceManager = useRef(getVoiceManager())
  const speechManager = useRef(getSpeechManager())
  const recordingTimer = useRef<NodeJS.Timeout>()
  const recordingStartTime = useRef<number>()

  // Проверяем доступность сервисов при монтировании
  useEffect(() => {
    setSTTAvailable(voiceManager.current.isSTTAvailable())
    setTTSAvailable(speechManager.current.isTTSAvailable())
  }, [])

  // Обновляем время записи
  useEffect(() => {
    if (isRecording) {
      recordingStartTime.current = Date.now()
      recordingTimer.current = setInterval(() => {
        if (recordingStartTime.current) {
          setRecordingTime(Math.floor((Date.now() - recordingStartTime.current) / 1000))
        }
      }, 1000)
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current)
      }
      setRecordingTime(0)
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current)
      }
    }
  }, [isRecording])

  // Мониторинг статуса TTS
  useEffect(() => {
    const checkTTSStatus = () => {
      const speaking = speechManager.current.isSpeaking()
      setIsSpeaking(speaking)
    }

    const interval = setInterval(checkTTSStatus, 500)
    return () => clearInterval(interval)
  }, [])

  const startRecording = async () => {
    if (!sttAvailable || disabled || isRecording) return

    try {
      setIsRecording(true)
      setIsProcessing(false)
      
      await voiceManager.current.startListening(30000) // Максимум 30 секунд
      
    } catch (error) {
      console.error('Ошибка начала записи:', error)
      setIsRecording(false)
      let errorMessage = 'Ошибка доступа к микрофону'
      
      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          errorMessage = 'Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера.'
        } else if (error.message.includes('NotFoundError')) {
          errorMessage = 'Микрофон не найден. Проверьте подключение микрофона.'
        } else if (error.message.includes('T-one')) {
          errorMessage = 'Ошибка подключения к серверу распознавания речи. Убедитесь, что T-one STT сервис запущен.'
        } else {
          errorMessage = error.message
        }
      }
      
      onError?.(errorMessage)
    }
  }

  const stopRecording = async () => {
    if (!isRecording) return

    try {
      setIsRecording(false)
      setIsProcessing(true)
      
      const transcription = await voiceManager.current.stopListening()
      
      if (transcription && transcription.trim()) {
        onTranscription?.(transcription)
      } else {
        onError?.('Не удалось распознать речь. Попробуйте говорить громче и четче.')
      }
      
    } catch (error) {
      console.error('Ошибка остановки записи:', error)
      let errorMessage = 'Ошибка обработки аудио'
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания ответа от сервера распознавания речи.'
        } else if (error.message.includes('T-one')) {
          errorMessage = 'Ошибка сервера распознавания речи. Проверьте подключение к T-one STT.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету.'
        } else {
          errorMessage = error.message
        }
      }
      
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  const stopSpeaking = () => {
    speechManager.current.stopSpeaking()
    setIsSpeaking(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getButtonSize = () => {
    const sizes = {
      sm: 'h-8 w-8',
      default: 'h-10 w-10',
      lg: 'h-12 w-12'
    }
    return sizes[size]
  }

  const getIconSize = () => {
    const sizes = {
      sm: 'h-3 w-3',
      default: 'h-4 w-4',
      lg: 'h-5 w-5'
    }
    return sizes[size]
  }

  // Если TTS говорит, показываем кнопку остановки
  if (isSpeaking) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="icon"
          onClick={stopSpeaking}
          className={cn(
            getButtonSize(),
            "bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
          )}
          title="Остановить озвучивание"
        >
          <VolumeX className={getIconSize()} />
        </Button>
        {size !== 'sm' && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Volume2 className="h-3 w-3" />
            <span>Озвучивание...</span>
          </div>
        )}
      </div>
    )
  }

  if (!sttAvailable) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={cn(getButtonSize(), "opacity-50", className)}
        title="Голосовой ввод недоступен"
      >
        <MicOff className={getIconSize()} />
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={cn(
          getButtonSize(),
          isRecording && "voice-recording animate-pulse-recording",
          isProcessing && "opacity-50",
          !isRecording && !isProcessing && sttAvailable && "hover:bg-blue-50 hover:border-blue-300"
        )}
        title={
          isRecording 
            ? "Остановить запись" 
            : isProcessing 
              ? "Обработка..." 
              : "Начать голосовой ввод"
        }
      >
        {isProcessing ? (
          <div className="animate-spin">
            <Mic className={getIconSize()} />
          </div>
        ) : isRecording ? (
          <div className="voice-indicator">
            <Mic className={getIconSize()} />
          </div>
        ) : (
          <Mic className={getIconSize()} />
        )}
      </Button>

      {/* Индикатор времени записи */}
      {isRecording && size !== 'sm' && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Индикатор обработки */}
      {isProcessing && size !== 'sm' && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Обработка...</span>
        </div>
      )}
    </div>
  )
}

// Компонент для озвучивания текста
interface TextToSpeechProps {
  text: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function TextToSpeech({ 
  text, 
  onStart, 
  onEnd, 
  onError,
  disabled = false,
  size = 'default',
  className = ''
}: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsAvailable, setTTSAvailable] = useState(false)
  
  const speechManager = useRef(getSpeechManager())

  useEffect(() => {
    setTTSAvailable(speechManager.current.isTTSAvailable())
  }, [])

  const handleSpeak = async () => {
    if (!text.trim() || !ttsAvailable || disabled) return

    try {
      setIsSpeaking(true)
      onStart?.()
      
      await speechManager.current.speakText(text)
      
    } catch (error) {
      console.error('Ошибка озвучивания:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ошибка озвучивания'
      onError?.(errorMessage)
    } finally {
      setIsSpeaking(false)
      onEnd?.()
    }
  }

  const handleStop = () => {
    speechManager.current.stopSpeaking()
    setIsSpeaking(false)
    onEnd?.()
  }

  const getButtonSize = () => {
    const sizes = {
      sm: 'h-8 w-8',
      default: 'h-10 w-10', 
      lg: 'h-12 w-12'
    }
    return sizes[size]
  }

  const getIconSize = () => {
    const sizes = {
      sm: 'h-3 w-3',
      default: 'h-4 w-4',
      lg: 'h-5 w-5'
    }
    return sizes[size]
  }

  if (!ttsAvailable) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={cn(getButtonSize(), "opacity-50", className)}
        title="Озвучивание недоступно"
      >
        <VolumeX className={getIconSize()} />
      </Button>
    )
  }

  return (
    <Button
      variant={isSpeaking ? "destructive" : "outline"}
      size="icon"
      onClick={isSpeaking ? handleStop : handleSpeak}
      disabled={disabled || !text.trim()}
      className={cn(
        getButtonSize(),
        isSpeaking && "animate-pulse",
        !isSpeaking && "hover:bg-blue-50 hover:border-blue-300",
        className
      )}
      title={isSpeaking ? "Остановить озвучивание" : "Озвучить текст"}
    >
      {isSpeaking ? (
        <VolumeX className={getIconSize()} />
      ) : (
        <Volume2 className={getIconSize()} />
      )}
    </Button>
  )
}
