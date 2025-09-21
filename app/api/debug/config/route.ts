/**
 * Debug endpoint для проверки конфигурации
 */

import { NextResponse } from 'next/server'
import { getLLMConfig } from '@/config/llm'
import { getFeatureFlags } from '@/config/features'

export async function GET() {
  try {
    const config = getLLMConfig()
    const flags = getFeatureFlags()
    
    return NextResponse.json({
      // Не показываем API ключ полностью для безопасности
      config: {
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'NOT_SET'
      },
      flags,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_ENABLE_SCIBOX_LLM: process.env.NEXT_PUBLIC_ENABLE_SCIBOX_LLM,
        NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE,
        HAS_SCIBOX_API_KEY: !!process.env.SCIBOX_API_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
