// TTS (Text-to-Speech) клиент для голосового вывода
import { TTSProvider } from '@/types'
import { isFeatureEnabled, providerConfig } from '@/config/features'

// Абстрактный интерфейс для TTS провайдеров
export interface TTSClient extends TTSProvider {
  speak(text: string, options?: TTSOptions): Promise<void>
  stop(): void
  pause(): void
  resume(): void
  getStatus(): 'idle' | 'speaking' | 'paused' | 'error'
  setVoice(voiceId: string): void
  setRate(rate: number): void
  setPitch(pitch: number): void
  setVolume(volume: number): void
}

export interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  language?: string
}

// Mock реализация для разработки
class MockTTSClient implements TTSClient {
  private status: 'idle' | 'speaking' | 'paused' | 'error' = 'idle'
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private audio: HTMLAudioElement | null = null
  
  // Настройки по умолчанию
  private settings = {
    voice: 'ru-RU',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'ru-RU'
  }
  
  async synthesize(text: string, voice?: string): Promise<Blob> {
    // В mock режиме возвращаем пустой blob
    // В реальной реализации здесь был бы вызов к TTS API
    return new Blob(['mock audio data'], { type: 'audio/wav' })
  }
  
  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('TTS не поддерживается браузером')
    }
    
    try {
      this.stop() // Останавливаем предыдущее воспроизведение
      
      // Используем Web Speech API для демонстрации
      if ('speechSynthesis' in window) {
        return this.speakWithWebAPI(text, options)
      } else {
        // Fallback: воспроизводим mock звук
        return this.speakWithMockAudio(text, options)
      }
      
    } catch (error) {
      this.status = 'error'
      console.error('TTS error:', error)
      throw error
    }
  }
  
  private async speakWithWebAPI(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Применяем настройки
      utterance.rate = options?.rate || this.settings.rate
      utterance.pitch = options?.pitch || this.settings.pitch
      utterance.volume = options?.volume || this.settings.volume
      utterance.lang = options?.language || this.settings.language
      
      // Пытаемся найти русский голос
      const voices = speechSynthesis.getVoices()
      const russianVoice = voices.find(voice => 
        voice.lang.startsWith('ru') || voice.name.includes('Russian')
      )
      if (russianVoice) {
        utterance.voice = russianVoice
      }
      
      utterance.onstart = () => {
        this.status = 'speaking'
        console.log('TTS начал говорить (Web Speech API)')
      }
      
      utterance.onend = () => {
        this.status = 'idle'
        this.currentUtterance = null
        resolve()
      }
      
      utterance.onerror = (event) => {
        this.status = 'error'
        this.currentUtterance = null
        reject(new Error(`TTS error: ${event.error}`))
      }
      
      utterance.onpause = () => {
        this.status = 'paused'
      }
      
      utterance.onresume = () => {
        this.status = 'speaking'
      }
      
      this.currentUtterance = utterance
      speechSynthesis.speak(utterance)
    })
  }
  
  private async speakWithMockAudio(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Создаем короткий mock звук для демонстрации
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime) // A3 note
      gainNode.gain.setValueAtTime(options?.volume || 0.1, audioContext.currentTime)
      
      this.status = 'speaking'
      
      // Имитируем длительность озвучки на основе длины текста
      const duration = Math.min(text.length * 50, 3000) // Макс 3 секунды
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
      
      oscillator.onended = () => {
        this.status = 'idle'
        resolve()
      }
      
      setTimeout(() => {
        if (this.status === 'speaking') {
          this.status = 'idle'
          resolve()
        }
      }, duration)
    })
  }
  
  stop(): void {
    if ('speechSynthesis' in window && this.currentUtterance) {
      speechSynthesis.cancel()
      this.currentUtterance = null
    }
    
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio = null
    }
    
    this.status = 'idle'
  }
  
  pause(): void {
    if ('speechSynthesis' in window && this.status === 'speaking') {
      speechSynthesis.pause()
      this.status = 'paused'
    }
    
    if (this.audio && !this.audio.paused) {
      this.audio.pause()
      this.status = 'paused'
    }
  }
  
  resume(): void {
    if ('speechSynthesis' in window && this.status === 'paused') {
      speechSynthesis.resume()
      this.status = 'speaking'
    }
    
    if (this.audio && this.audio.paused && this.status === 'paused') {
      this.audio.play()
      this.status = 'speaking'
    }
  }
  
  getStatus(): 'idle' | 'speaking' | 'paused' | 'error' {
    return this.status
  }
  
  async getAvailableVoices(): Promise<string[]> {
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices()
        
        if (voices.length === 0) {
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices()
            resolve(voices.map(voice => `${voice.name} (${voice.lang})`))
          }
        } else {
          resolve(voices.map(voice => `${voice.name} (${voice.lang})`))
        }
      })
    }
    
    return ['Mock Russian Voice', 'Mock English Voice']
  }
  
  setVoice(voiceId: string): void {
    this.settings.voice = voiceId
  }
  
  setRate(rate: number): void {
    this.settings.rate = Math.max(0.1, Math.min(10, rate))
  }
  
  setPitch(pitch: number): void {
    this.settings.pitch = Math.max(0, Math.min(2, pitch))
  }
  
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume))
  }
  
  isAvailable(): boolean {
    return 'speechSynthesis' in window || 'AudioContext' in window
  }
}

// Локальный TTS клиент (для on-prem решений)
class LocalTTSClient implements TTSClient {
  private apiUrl: string
  private status: 'idle' | 'speaking' | 'paused' | 'error' = 'idle'
  private currentAudio: HTMLAudioElement | null = null
  
  private settings = {
    voice: 'ru-female-1',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'ru-RU'
  }
  
  constructor() {
    this.apiUrl = providerConfig.localTTS.apiUrl
  }
  
  async synthesize(text: string, voice?: string): Promise<Blob> {
    if (!this.isAvailable()) {
      throw new Error('Локальный TTS сервис недоступен')
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: voice || this.settings.voice,
          rate: this.settings.rate,
          pitch: this.settings.pitch,
          format: 'wav'
        }),
        signal: AbortSignal.timeout(providerConfig.localTTS.timeout)
      })
      
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
      }
      
      return await response.blob()
      
    } catch (error) {
      console.error('Local TTS error:', error)
      throw error
    }
  }
  
  async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      this.stop() // Останавливаем предыдущее воспроизведение
      
      const audioBlob = await this.synthesize(text, options?.voice)
      const audioUrl = URL.createObjectURL(audioBlob)
      
      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(audioUrl)
        this.currentAudio.volume = options?.volume || this.settings.volume
        
        // Эмулируем rate через playbackRate (приблизительно)
        if (options?.rate) {
          this.currentAudio.playbackRate = options.rate
        }
        
        this.currentAudio.onplay = () => {
          this.status = 'speaking'
        }
        
        this.currentAudio.onended = () => {
          this.status = 'idle'
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          resolve()
        }
        
        this.currentAudio.onerror = (error) => {
          this.status = 'error'
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          reject(error)
        }
        
        this.currentAudio.onpause = () => {
          this.status = 'paused'
        }
        
        this.currentAudio.play()
      })
      
    } catch (error) {
      this.status = 'error'
      throw error
    }
  }
  
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.status = 'idle'
  }
  
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
      this.status = 'paused'
    }
  }
  
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused && this.status === 'paused') {
      this.currentAudio.play()
      this.status = 'speaking'
    }
  }
  
  getStatus(): 'idle' | 'speaking' | 'paused' | 'error' {
    return this.status
  }
  
  async getAvailableVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/voices`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.voices || []
      
    } catch (error) {
      console.error('Error fetching voices:', error)
      return ['ru-female-1', 'ru-male-1', 'en-female-1']
    }
  }
  
  setVoice(voiceId: string): void {
    this.settings.voice = voiceId
  }
  
  setRate(rate: number): void {
    this.settings.rate = Math.max(0.1, Math.min(3, rate))
  }
  
  setPitch(pitch: number): void {
    this.settings.pitch = Math.max(0.5, Math.min(2, pitch))
  }
  
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume))
  }
  
  isAvailable(): boolean {
    return !!this.apiUrl
  }
}

// Фабрика для создания TTS клиента
export function createTTSClient(): TTSClient {
  if (isFeatureEnabled('enableLocalTTS') && !isFeatureEnabled('mockMode')) {
    return new LocalTTSClient()
  } else {
    return new MockTTSClient()
  }
}

// Синглтон клиента
let ttsClientInstance: TTSClient | null = null

export function getTTSClient(): TTSClient {
  if (!ttsClientInstance) {
    ttsClientInstance = createTTSClient()
  }
  return ttsClientInstance
}

// Менеджер для удобной работы с TTS
export class SpeechManager {
  private ttsClient: TTSClient
  private queue: Array<{ text: string; options?: TTSOptions }> = []
  private isProcessingQueue = false
  
  constructor() {
    this.ttsClient = getTTSClient()
  }
  
  async speakText(text: string, options?: TTSOptions): Promise<void> {
    if (!text.trim()) {
      return
    }
    
    try {
      await this.ttsClient.speak(text, options)
    } catch (error) {
      console.error('Speech error:', error)
      throw error
    }
  }
  
  async speakWithQueue(text: string, options?: TTSOptions): Promise<void> {
    this.queue.push({ text, options })
    
    if (!this.isProcessingQueue) {
      await this.processQueue()
    }
  }
  
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      try {
        await this.speakText(item.text, item.options)
      } catch (error) {
        console.error('Queue processing error:', error)
        // Продолжаем обработку очереди даже при ошибке
      }
    }
    
    this.isProcessingQueue = false
  }
  
  stopSpeaking(): void {
    this.ttsClient.stop()
    this.queue = [] // Очищаем очередь
    this.isProcessingQueue = false
  }
  
  pauseSpeaking(): void {
    this.ttsClient.pause()
  }
  
  resumeSpeaking(): void {
    this.ttsClient.resume()
  }
  
  getSpeechStatus(): 'idle' | 'speaking' | 'paused' | 'error' {
    return this.ttsClient.getStatus()
  }
  
  isSpeaking(): boolean {
    return this.ttsClient.getStatus() === 'speaking'
  }
  
  isTTSAvailable(): boolean {
    return this.ttsClient.isAvailable()
  }
  
  async getVoices(): Promise<string[]> {
    return this.ttsClient.getAvailableVoices()
  }
  
  setVoiceSettings(settings: Partial<TTSOptions>): void {
    if (settings.voice) this.ttsClient.setVoice(settings.voice)
    if (settings.rate !== undefined) this.ttsClient.setRate(settings.rate)
    if (settings.pitch !== undefined) this.ttsClient.setPitch(settings.pitch)
    if (settings.volume !== undefined) this.ttsClient.setVolume(settings.volume)
  }
}

// Глобальный экземпляр speech manager
let speechManagerInstance: SpeechManager | null = null

export function getSpeechManager(): SpeechManager {
  if (!speechManagerInstance) {
    speechManagerInstance = new SpeechManager()
  }
  return speechManagerInstance
}

// Сброс клиентов (для тестов)
export function resetTTSClient(): void {
  ttsClientInstance = null
  speechManagerInstance = null
}
