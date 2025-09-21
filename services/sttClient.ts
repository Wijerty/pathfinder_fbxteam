// STT (Speech-to-Text) клиент для голосового ввода
import { STTProvider } from '@/types'
import { isFeatureEnabled, providerConfig } from '@/config/features'

// Абстрактный интерфейс для STT провайдеров
export interface STTClient extends STTProvider {
  startRecording(): Promise<MediaRecorder | null>
  stopRecording(): Promise<Blob | null>
  getStatus(): 'idle' | 'recording' | 'processing' | 'error'
}

// Mock реализация для разработки
class MockSTTClient implements STTClient {
  private status: 'idle' | 'recording' | 'processing' | 'error' = 'idle'
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  
  // Mock фразы для демонстрации
  private mockTranscriptions = [
    "Какие навыки мне нужно развить для роли Senior Frontend Developer?",
    "Покажи мне рекомендованные курсы по React и TypeScript",
    "Как добавить новый навык в мой профиль?",
    "Кто в команде может помочь с изучением машинного обучения?",
    "Расскажи о доступных вакансиях в отделе Data Science",
    "Какие квесты можно выполнить на этой неделе?",
    "Помоги составить план развития карьеры",
    "Покажи статистику по моему профилю",
    "Найди коллег с навыками в области DevOps",
    "Какие тренды сейчас важны в нашей индустрии?"
  ]
  
  async transcribe(audioData: Blob): Promise<string> {
    this.status = 'processing'
    
    // Имитация обработки аудио
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
    
    try {
      // Возвращаем случайную mock транскрипцию
      const randomTranscription = this.mockTranscriptions[
        Math.floor(Math.random() * this.mockTranscriptions.length)
      ]
      
      this.status = 'idle'
      return randomTranscription
      
    } catch (error) {
      this.status = 'error'
      console.error('Mock STT error:', error)
      throw new Error('Ошибка распознавания речи (mock)')
    }
  }
  
  async startRecording(): Promise<MediaRecorder | null> {
    try {
      // Проверяем поддержку медиа API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Медиа API не поддерживается браузером')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      })
      
      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      this.mediaRecorder.onstart = () => {
        this.status = 'recording'
        console.log('Запись началась (mock mode)')
      }
      
      this.mediaRecorder.onstop = () => {
        this.status = 'idle'
        // Останавливаем все треки для освобождения микрофона
        stream.getTracks().forEach(track => track.stop())
      }
      
      this.mediaRecorder.onerror = (event) => {
        this.status = 'error'
        console.error('Ошибка записи:', event)
      }
      
      this.mediaRecorder.start(1000) // Сохраняем данные каждую секунду
      return this.mediaRecorder
      
    } catch (error) {
      this.status = 'error'
      console.error('Ошибка доступа к микрофону:', error)
      throw error
    }
  }
  
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null
    }
    
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.getSupportedMimeType() 
        })
        this.audioChunks = []
        resolve(audioBlob)
      }
      
      this.mediaRecorder!.stop()
    })
  }
  
  getStatus(): 'idle' | 'recording' | 'processing' | 'error' {
    return this.status
  }
  
  isAvailable(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }
  
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    
    return 'audio/webm' // fallback
  }
}

// T-one STT клиент для локального распознавания речи
class ToneSTTClient implements STTClient {
  private wsUrl: string
  private status: 'idle' | 'recording' | 'processing' | 'error' = 'idle'
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private ws: WebSocket | null = null

  constructor() {
    // Конвертируем HTTP URL в WebSocket URL для T-one STT
    // T-one использует endpoint /api/ws согласно тестовому файлу
    const httpUrl = providerConfig.localSTT.apiUrl
    this.wsUrl = httpUrl.replace(/^http/, 'ws') + '/api/ws'
  }

  async transcribe(audioData: Blob): Promise<string> {
    this.status = 'processing'
    
    try {
      // Конвертируем аудио в нужный формат для T-one (PCM 16-bit, 16kHz)
      const audioBuffer = await this.convertAudioForTone(audioData)
      
      // Используем WebSocket для T-one STT
      console.log(`Отправляем данные в T-one через WebSocket: ${this.wsUrl}`)
      console.log(`Размер аудио данных: ${audioBuffer.byteLength} байт`)
      
      const result = await this.transcribeWebSocket(audioData)
      
      this.status = 'idle'
      return result || 'Пустой ответ от T-one'
      
    } catch (error) {
      this.status = 'error'
      console.error('Ошибка T-one transcribe:', error)
      throw error
    }
  }
  
  // Оставляем старый WebSocket код как fallback
  async transcribeWebSocket(audioData: Blob): Promise<string> {
    this.status = 'processing'
    
    try {
      // Конвертируем аудио в нужный формат для T-one (PCM 16-bit, 16kHz)
      const audioBuffer = await this.convertAudioForTone(audioData)
      
      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.cleanup()
          reject(new Error('Таймаут подключения к T-one'))
        }, providerConfig.localSTT.timeout)
        
        // Создаем WebSocket с правильными заголовками для T-one
        this.ws = new WebSocket(this.wsUrl, [])
        let transcriptionResult = ''
        
        this.ws.onopen = () => {
          console.log('T-one WebSocket подключен')
          // Отправляем аудио данные
          this.sendAudioData(audioBuffer)
        }
        
        this.ws.onmessage = (event) => {
          console.log('Получено сообщение от T-one:', event.data)
          console.log('Тип данных:', typeof event.data)
          
          try {
            const data = JSON.parse(event.data)
            console.log('T-one WebSocket сообщение:', data)
            
            if (data.event === 'transcript' && data.phrase && data.phrase.text) {
              // Получили транскрипцию фразы
              transcriptionResult += data.phrase.text + ' '
              console.log('Получена транскрипция:', data.phrase.text)
            }
          } catch (error) {
            console.error('Ошибка парсинга сообщения T-one:', error)
            console.log('Необработанные данные:', event.data)
          }
        }
        
        this.ws.onclose = (event) => {
          console.log('T-one WebSocket закрыт, код:', event.code, 'причина:', event.reason)
          console.log('Итоговый результат транскрипции:', transcriptionResult)
          clearTimeout(timeout)
          this.cleanup()
          
          if (transcriptionResult.trim()) {
            this.status = 'idle'
            resolve(transcriptionResult.trim())
          } else {
            console.warn('Пустой результат транскрипции от T-one')
            this.status = 'error'
            reject(new Error('Пустой результат транскрипции от T-one'))
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('Ошибка T-one WebSocket:', error)
          clearTimeout(timeout)
          this.cleanup()
          this.status = 'error'
          reject(new Error(`Ошибка WebSocket подключения к T-one: ${error}`))
        }
      })
      
    } catch (error) {
      this.status = 'error'
      console.error('T-one STT error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от T-one STT')
        }
        throw new Error(`Ошибка T-one STT: ${error.message}`)
      }
      
      throw new Error('Неизвестная ошибка T-one STT')
    }
  }

  private sendAudioData(audioBuffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    
    console.log(`Отправляем аудио данные в T-one: ${audioBuffer.byteLength} байт`)
    
    // Отправляем аудио данные чанками
    const chunkSize = 4096
    const uint8Array = new Uint8Array(audioBuffer)
    
    let chunkCount = 0
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      this.ws.send(chunk)
      chunkCount++
      console.log(`Отправлен чанк ${chunkCount}: ${chunk.length} байт`)
    }
    
    console.log(`Все аудио данные отправлены (${chunkCount} чанков), закрываем соединение`)
    // Сигнализируем об окончании передачи
    this.ws.close()
  }

  private cleanup() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private async convertAudioForTone(audioBlob: Blob): Promise<ArrayBuffer> {
    try {
      // Создаем AudioContext для конвертации
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Конвертируем в 16kHz mono для T-one
      const targetSampleRate = 16000
      const numberOfChannels = 1
      
      const offlineContext = new OfflineAudioContext(
        numberOfChannels,
        audioBuffer.duration * targetSampleRate,
        targetSampleRate
      )
      
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineContext.destination)
      source.start()
      
      const renderedBuffer = await offlineContext.startRendering()
      
      // Конвертируем в PCM 16-bit для WebSocket передачи
      const pcmData = this.audioBufferToPCM16(renderedBuffer)
      
      await audioContext.close()
      
      return pcmData
      
    } catch (error) {
      console.error('Ошибка конвертации аудио для T-one:', error)
      throw new Error('Не удалось конвертировать аудио для T-one')
    }
  }

  private audioBufferToPCM16(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const arrayBuffer = new ArrayBuffer(length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // Convert float samples to 16-bit PCM
    let offset = 0
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return arrayBuffer
  }


  
  async startRecording(): Promise<MediaRecorder | null> {
    if (this.status !== 'idle') return null
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,  // T-one предпочитает 16kHz
          channelCount: 1,    // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Используем WAV формат для лучшей совместимости с T-one
      const mimeType = this.getSupportedMimeType()
      this.mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      })
      
      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      this.mediaRecorder.start(1000) // Записываем чанками по 1 секунде
      this.status = 'recording'
      
      return this.mediaRecorder
      
    } catch (error) {
      this.status = 'error'
      console.error('T-one STT recording error:', error)
      throw new Error(`Ошибка записи для T-one STT: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }
  
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.status !== 'recording') return null
    
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null)
        return
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/wav' })
        this.status = 'idle'
        
        // Останавливаем все треки
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        
        resolve(audioBlob)
      }
      
      this.mediaRecorder.stop()
    })
  }
  
  getStatus(): 'idle' | 'recording' | 'processing' | 'error' {
    return this.status
  }
  
  isAvailable(): boolean {
    // Проверяем доступность T-one API
    return navigator.mediaDevices && 
           navigator.mediaDevices.getUserMedia &&
           isFeatureEnabled('enableLocalSTT') &&
           !!providerConfig.localSTT.apiUrl
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/wav',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    
    return 'audio/webm' // Fallback
  }
}

// Фабрика для создания STT клиента
export function createSTTClient(): STTClient {
  if (isFeatureEnabled('enableLocalSTT') && !isFeatureEnabled('mockMode')) {
    return new ToneSTTClient()
  } else {
    return new MockSTTClient()
  }
}

// Синглтон клиента
let sttClientInstance: STTClient | null = null

export function getSTTClient(): STTClient {
  if (!sttClientInstance) {
    sttClientInstance = createSTTClient()
  }
  return sttClientInstance
}

// Хелперы для работы с голосом
export class VoiceManager {
  private sttClient: STTClient
  private isRecording = false
  private recordingTimeoutId: number | null = null
  
  constructor() {
    this.sttClient = getSTTClient()
  }
  
  async startListening(maxDuration: number = 30000): Promise<void> {
    if (this.isRecording) {
      throw new Error('Запись уже идёт')
    }
    
    try {
      await this.sttClient.startRecording()
      this.isRecording = true
      
      // Автоматическая остановка через maxDuration
      this.recordingTimeoutId = window.setTimeout(() => {
        this.stopListening()
      }, maxDuration)
      
    } catch (error) {
      this.isRecording = false
      throw error
    }
  }
  
  async stopListening(): Promise<string | null> {
    if (!this.isRecording) {
      return null
    }
    
    try {
      this.isRecording = false
      
      if (this.recordingTimeoutId) {
        clearTimeout(this.recordingTimeoutId)
        this.recordingTimeoutId = null
      }
      
      const audioBlob = await this.sttClient.stopRecording()
      
      if (!audioBlob) {
        return null
      }
      
      // Транскрибируем аудио
      const transcription = await this.sttClient.transcribe(audioBlob)
      return transcription
      
    } catch (error) {
      console.error('Ошибка остановки записи:', error)
      throw error
    }
  }
  
  getRecordingStatus(): 'idle' | 'recording' | 'processing' | 'error' {
    return this.sttClient.getStatus()
  }
  
  isCurrentlyRecording(): boolean {
    return this.isRecording
  }
  
  isSTTAvailable(): boolean {
    return this.sttClient.isAvailable()
  }
}

// Глобальный экземпляр voice manager
let voiceManagerInstance: VoiceManager | null = null

export function getVoiceManager(): VoiceManager {
  if (!voiceManagerInstance) {
    voiceManagerInstance = new VoiceManager()
  }
  return voiceManagerInstance
}

// Сброс клиентов (для тестов)
export function resetSTTClient(): void {
  sttClientInstance = null
  voiceManagerInstance = null
}
