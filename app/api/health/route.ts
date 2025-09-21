// Health check endpoint для мониторинга
import { NextResponse } from 'next/server'
import { checkServicesHealth } from '@/services'

export async function GET() {
  try {
    // Проверяем доступность основных сервисов
    const servicesHealth = await checkServicesHealth()
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: servicesHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
    
    // Если критичные сервисы недоступны, возвращаем 503
    const isCriticalFailure = !servicesHealth.overall
    
    return NextResponse.json(health, { 
      status: isCriticalFailure ? 503 : 200 
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 })
  }
}
