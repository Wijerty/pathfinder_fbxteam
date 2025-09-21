'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Bookmark,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
  Type
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextLessonProps {
  title: string
  content: string
  estimatedReadTime?: number
  onComplete?: () => void
  onProgress?: (progress: number) => void
  isCompleted?: boolean
  className?: string
}

export function TextLesson({
  title,
  content,
  estimatedReadTime,
  onComplete,
  onProgress,
  isCompleted = false,
  className = ''
}: TextLessonProps) {
  const [readingProgress, setReadingProgress] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [startTime] = useState(Date.now())
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      if (isVisible) {
        setTimeSpent(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('text-content')
      if (!element) return

      const { scrollTop, scrollHeight, clientHeight } = element
      const progress = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100)
      
      setReadingProgress(progress)
      onProgress?.(progress)

      // Автоматически отмечаем как завершенное при 90% прочтения
      if (progress >= 90 && !isCompleted) {
        onComplete?.()
      }
    }

    const element = document.getElementById('text-content')
    element?.addEventListener('scroll', handleScroll)
    
    return () => element?.removeEventListener('scroll', handleScroll)
  }, [onComplete, onProgress, isCompleted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMarkAsComplete = () => {
    setReadingProgress(100)
    onProgress?.(100)
    onComplete?.()
  }

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)))
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // Здесь можно добавить логику сохранения закладки
  }

  const shareLesson = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Изучаю урок: ${title}`,
        url: window.location.href
      })
    } else {
      // Fallback - копирование в буфер обмена
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const downloadContent = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Простой парсер Markdown для базовых элементов
  const parseMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gim, '<p class="mb-4">$1</p>')
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <BookOpen className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {estimatedReadTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{estimatedReadTime} мин чтения</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>Время: {formatTime(timeSpent)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize(-2)}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize(2)}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBookmark}
              className={cn(
                'h-8 w-8 p-0',
                isBookmarked && 'text-yellow-600'
              )}
            >
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shareLesson}
              className="h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={downloadContent}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Прогресс чтения</span>
            <span className="text-muted-foreground">{Math.round(readingProgress)}%</span>
          </div>
          <Progress value={readingProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Text Content */}
        <div 
          id="text-content"
          className="max-h-96 overflow-y-auto p-6 prose prose-sm max-w-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div 
            className="leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {readingProgress >= 90 ? (
                <span className="text-green-600 font-medium">✓ Урок прочитан</span>
              ) : (
                <span>Продолжайте чтение для завершения урока</span>
              )}
            </div>
            
            {!isCompleted && readingProgress < 90 && (
              <Button
                onClick={handleMarkAsComplete}
                size="sm"
                variant="outline"
              >
                Отметить как прочитанное
              </Button>
            )}
            
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Завершено</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TextLesson