// Feature flags для PathFinder
import { FeatureFlags } from '@/types'

export const defaultFeatureFlags: FeatureFlags = {
  // LLM провайдеры (по умолчанию отключены для безопасности)
  enableSciboxLLM: process.env.NEXT_PUBLIC_ENABLE_SCIBOX_LLM === 'true',
  
  // STT/TTS провайдеры (по умолчанию отключены)
  enableLocalSTT: process.env.NEXT_PUBLIC_ENABLE_LOCAL_STT === 'true',
  enableLocalTTS: process.env.NEXT_PUBLIC_ENABLE_LOCAL_TTS === 'true',
  
  // Интеграции с внешними системами (по умолчанию отключены)
  enableHRISImport: process.env.NEXT_PUBLIC_ENABLE_HRIS_IMPORT === 'true',
  enableLMSImport: process.env.NEXT_PUBLIC_ENABLE_LMS_IMPORT === 'true',
  enableATSImport: process.env.NEXT_PUBLIC_ENABLE_ATS_IMPORT === 'true',
  
  // Аудит и логирование
  enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
  
  // PII редактирование в логах
  enablePIIRedaction: process.env.ENABLE_PII_REDACTION === 'true',
  
  // Mock режим (контролируется явно)
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
}

// Функция для безопасного получения feature flags
export function getFeatureFlags(): FeatureFlags {
  return {
    ...defaultFeatureFlags,
    // В production принудительно отключаем небезопасные флаги
    ...(process.env.NODE_ENV === 'production' && {
      mockMode: false,
    enableSciboxLLM: process.env.NEXT_PUBLIC_ENABLE_SCIBOX_LLM === 'true',
    enableLocalSTT: process.env.NEXT_PUBLIC_ENABLE_LOCAL_STT === 'true',
    enableLocalTTS: process.env.NEXT_PUBLIC_ENABLE_LOCAL_TTS === 'true',
    enablePIIRedaction: process.env.ENABLE_PII_REDACTION === 'true'
    })
  }
}

// Проверка доступности функции
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags()
  return flags[feature]
}

// Конфигурация провайдеров
export const providerConfig = {
  scibox: {
    apiUrl: process.env.SCIBOX_API_URL || '',
    apiKey: process.env.SCIBOX_API_KEY || '',
    timeout: 30000,
    maxRetries: 3
  },
  
  localSTT: {
    apiUrl: process.env.LOCAL_STT_API_URL || 'http://localhost:8080',
    timeout: 15000,  // Увеличиваем таймаут для T-one
    maxRetries: 2,
    // Специфичные настройки для T-one
    sampleRate: 16000,
    language: 'ru',
    format: 'wav'
  },
  
  localTTS: {
    apiUrl: process.env.LOCAL_TTS_API_URL || 'http://localhost:8002/tts',
    timeout: 15000,
    maxRetries: 2
  },
  
  hris: {
    apiUrl: process.env.HRIS_API_URL || '',
    apiKey: process.env.HRIS_API_KEY || '',
    syncInterval: 24 * 60 * 60 * 1000 // 24 часа
  },
  
  lms: {
    apiUrl: process.env.LMS_API_URL || '',
    apiKey: process.env.LMS_API_KEY || '',
    syncInterval: 12 * 60 * 60 * 1000 // 12 часов
  },
  
  ats: {
    apiUrl: process.env.ATS_API_URL || '',
    apiKey: process.env.ATS_API_KEY || '',
    syncInterval: 6 * 60 * 60 * 1000 // 6 часов
  }
}
