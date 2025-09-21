'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Code,
  Video,
  FileText,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  Target,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface CourseLesson {
  id: string
  type: 'video' | 'text' | 'quiz' | 'code'
  title: string
  description?: string
  content: any
  order: number
  isRequired: boolean
  estimatedTime?: number
  isCompleted?: boolean
}

interface QuestCourse {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
  passingScore: number
  tags: string[]
  lessons: CourseLesson[]
  rewards: {
    points: number
    badges?: string[]
    certificates?: boolean
  }
  instructor?: {
    name: string
    avatar?: string
    bio?: string
  }
  rating?: {
    average: number
    count: number
  }
  enrolledCount?: number
  isEnrolled?: boolean
  progress?: number
  lastAccessed?: Date
  createdAt: Date
  updatedAt: Date
}

interface CourseViewerProps {
  course: QuestCourse
  onComplete: (courseId: string, score: number) => void
  onLessonComplete: (lessonId: string, courseId: string) => void
  onExit: () => void
  className?: string
}

interface QuizQuestion {
  id: string
  type: 'single_choice' | 'multiple_choice' | 'text' | 'code'
  question: string
  options?: string[]
  correctAnswer?: number | number[] | string
  explanation?: string
}

interface CodeExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

export function CourseViewer({ course, onComplete, onLessonComplete, onExit, className = '' }: CourseViewerProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({})
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({})
  const [codeInput, setCodeInput] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isCodeRunning, setIsCodeRunning] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoVolume, setVideoVolume] = useState(1)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)

  const currentLesson = course.lessons[currentLessonIndex]
  const totalLessons = course.lessons.length
  const completedLessons = Object.keys(lessonProgress).length
  const courseProgress = Math.round((completedLessons / totalLessons) * 100)

  useEffect(() => {
    if (currentLesson?.type === 'code' && currentLesson.content.initialCode) {
      setCodeInput(currentLesson.content.initialCode)
      setCodeOutput('')
      setCodeError('')
      setShowSolution(false)
      setShowHints(false)
    }
    
    if (currentLesson?.type === 'quiz') {
      setQuizAnswers({})
      setQuizScore(0)
      setIsQuizSubmitted(false)
    }
    
    if (currentLesson?.type === 'text') {
      setReadingProgress(0)
    }
  }, [currentLessonIndex, currentLesson])

  const handleLessonComplete = () => {
    if (!currentLesson) return
    
    const newProgress = { ...lessonProgress, [currentLesson.id]: true }
    setLessonProgress(newProgress)
    onLessonComplete(currentLesson.id, course.id)
    
    if (currentLessonIndex < totalLessons - 1) {
      setTimeout(() => {
        setCurrentLessonIndex(prev => prev + 1)
      }, 1500)
    } else {
      const finalScore = Math.round((Object.keys(newProgress).length / totalLessons) * 100)
      setTimeout(() => {
        onComplete(course.id, finalScore)
      }, 2000)
    }
  }

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1)
    }
  }

  const handleNextLesson = () => {
    if (currentLessonIndex < totalLessons - 1) {
      setCurrentLessonIndex(prev => prev + 1)
    }
  }

  // Компонент видео урока
  const VideoLesson = ({ lesson }: { lesson: CourseLesson }) => {
    const handleVideoPlay = () => {
      setIsVideoPlaying(true)
      videoRef.current?.play()
    }

    const handleVideoPause = () => {
      setIsVideoPlaying(false)
      videoRef.current?.pause()
    }

    const handleVideoEnd = () => {
      setIsVideoPlaying(false)
      setVideoProgress(100)
      handleLessonComplete()
    }

    const handleVideoProgress = () => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
        setVideoProgress(progress)
        
        if (progress >= 90 && !lessonProgress[lesson.id]) {
          handleLessonComplete()
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            onTimeUpdate={handleVideoProgress}
            onEnded={handleVideoEnd}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
          >
            <source src={lesson.content.videoUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={isVideoPlaying ? handleVideoPause : handleVideoPlay}
                className="text-white hover:bg-white/20"
              >
                {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1">
                <Progress value={videoProgress} className="h-1" />
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsVideoMuted(!isVideoMuted)
                  if (videoRef.current) {
                    videoRef.current.muted = !isVideoMuted
                  }
                }}
                className="text-white hover:bg-white/20"
              >
                {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Progress value={videoProgress} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Прогресс просмотра: {Math.round(videoProgress)}%
          </p>
        </div>
      </div>
    )
  }

  // Компонент текстового урока
  const TextLesson = ({ lesson }: { lesson: CourseLesson }) => {
    useEffect(() => {
      const handleScroll = () => {
        if (textContentRef.current) {
          const element = textContentRef.current
          const scrollProgress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100
          setReadingProgress(Math.min(scrollProgress, 100))
          
          if (scrollProgress >= 80 && !lessonProgress[lesson.id]) {
            handleLessonComplete()
          }
        }
      }

      const element = textContentRef.current
      element?.addEventListener('scroll', handleScroll)
      return () => element?.removeEventListener('scroll', handleScroll)
    }, [])

    return (
      <div className="space-y-4">
        <div 
          ref={textContentRef}
          className="prose prose-sm max-w-none h-96 overflow-y-auto p-6 bg-muted/30 rounded-lg"
          style={{ maxHeight: '400px' }}
        >
          <div dangerouslySetInnerHTML={{ __html: lesson.content.content.replace(/\n/g, '<br>') }} />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Progress value={readingProgress} className="w-32" />
            <span className="text-sm text-muted-foreground">
              {Math.round(readingProgress)}% прочитано
            </span>
          </div>
          
          {lesson.content.allowDownload && (
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </Button>
          )}
        </div>
        
        {readingProgress >= 80 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Урок завершен! Вы можете перейти к следующему уроку.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Компонент квиза
  const QuizLesson = ({ lesson }: { lesson: CourseLesson }) => {
    const questions: QuizQuestion[] = lesson.content.questions

    const handleAnswerChange = (questionId: string, answer: any) => {
      setQuizAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const handleQuizSubmit = () => {
      let correctAnswers = 0
      
      questions.forEach(question => {
        const userAnswer = quizAnswers[question.id]
        if (question.type === 'single_choice' && userAnswer === question.correctAnswer) {
          correctAnswers++
        }
      })
      
      const score = Math.round((correctAnswers / questions.length) * 100)
      setQuizScore(score)
      setIsQuizSubmitted(true)
      
      if (score >= lesson.content.passingScore) {
        handleLessonComplete()
      }
    }

    return (
      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Вопрос {index + 1} из {questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{question.question}</p>
              
              {question.type === 'single_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={optionIndex}
                        onChange={() => handleAnswerChange(question.id, optionIndex)}
                        disabled={isQuizSubmitted}
                        className="text-blue-600"
                      />
                      <span className={cn(
                        isQuizSubmitted && optionIndex === question.correctAnswer && 'text-green-600 font-medium',
                        isQuizSubmitted && optionIndex === quizAnswers[question.id] && optionIndex !== question.correctAnswer && 'text-red-600'
                      )}>
                        {option}
                      </span>
                      {isQuizSubmitted && optionIndex === question.correctAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {isQuizSubmitted && optionIndex === quizAnswers[question.id] && optionIndex !== question.correctAnswer && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </label>
                  ))}
                </div>
              )}
              
              {isQuizSubmitted && question.explanation && (
                <Alert className="mt-4">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>{question.explanation}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
        
        {!isQuizSubmitted ? (
          <Button 
            onClick={handleQuizSubmit}
            disabled={Object.keys(quizAnswers).length < questions.length}
            className="w-full"
          >
            Отправить ответы
          </Button>
        ) : (
          <Alert className={quizScore >= lesson.content.passingScore ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Ваш результат: {quizScore}% ({quizScore >= lesson.content.passingScore ? 'Пройден' : 'Не пройден'})
                </span>
                {quizScore < lesson.content.passingScore && lesson.content.allowRetry && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setQuizAnswers({})
                      setIsQuizSubmitted(false)
                      setQuizScore(0)
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Попробовать снова
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Компонент урока программирования
  const CodeLesson = ({ lesson }: { lesson: CourseLesson }) => {
    const runPythonCode = async (code: string): Promise<CodeExecutionResult> => {
      setIsCodeRunning(true)
      setCodeError('')
      setCodeOutput('')
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (code.includes('print("Hello, World!")')) {
          return {
            success: true,
            output: 'Hello, World!',
            executionTime: 0.1
          }
        } else if (code.includes('print(')) {
          const match = code.match(/print\(["'](.*?)["']\)/)
          if (match) {
            return {
              success: true,
              output: match[1],
              executionTime: 0.1
            }
          }
        }
        
        return {
          success: false,
          error: 'SyntaxError: invalid syntax'
        }
      } catch (error) {
        return {
          success: false,
          error: 'Ошибка выполнения кода'
        }
      } finally {
        setIsCodeRunning(false)
      }
    }

    const handleRunCode = async () => {
      const result = await runPythonCode(codeInput)
      
      if (result.success) {
        setCodeOutput(result.output || '')
        
        if (lesson.content.testCases) {
          const testPassed = lesson.content.testCases.some((testCase: any) => 
            result.output === testCase.expectedOutput
          )
          
          if (testPassed) {
            setTimeout(() => {
              handleLessonComplete()
            }, 1000)
          }
        }
      } else {
        setCodeError(result.error || 'Неизвестная ошибка')
      }
    }

    const handleShowSolution = () => {
      setShowSolution(true)
      setCodeInput(lesson.content.solution)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Редактор кода</h3>
              <div className="flex gap-2">
                {lesson.content.hints && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowHints(!showHints)}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {showHints ? 'Скрыть' : 'Подсказки'}
                  </Button>
                )}
                {lesson.content.allowSolutionView && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShowSolution}
                    disabled={showSolution}
                  >
                    {showSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    Решение
                  </Button>
                )}
              </div>
            </div>
            
            <Textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Введите ваш код здесь..."
              className="font-mono text-sm min-h-[300px] resize-none"
              style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
            />
            
            <Button 
              onClick={handleRunCode}
              disabled={isCodeRunning || !codeInput.trim()}
              className="w-full"
            >
              {isCodeRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Выполнение...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Запустить код
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Результат выполнения</h3>
            
            <Tabs defaultValue="output" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="output">Вывод</TabsTrigger>
                <TabsTrigger value="tests">Тесты</TabsTrigger>
              </TabsList>
              
              <TabsContent value="output" className="space-y-2">
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm min-h-[200px] overflow-auto">
                  {codeOutput && (
                    <div className="mb-2">
                      <span className="text-gray-400">>>> </span>
                      <span>{codeOutput}</span>
                    </div>
                  )}
                  {codeError && (
                    <div className="text-red-400">
                      <span className="text-gray-400">Error: </span>
                      <span>{codeError}</span>
                    </div>
                  )}
                  {!codeOutput && !codeError && (
                    <span className="text-gray-500">Нажмите "Запустить код" для выполнения</span>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="tests" className="space-y-2">
                <div className="space-y-2">
                  {lesson.content.testCases?.map((testCase: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Ожидается: </span>
                        <code className="bg-background px-2 py-1 rounded">{testCase.expectedOutput}</code>
                      </div>
                      {codeOutput === testCase.expectedOutput ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {showHints && lesson.content.hints && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {lesson.content.hints.map((hint: string, index: number) => (
                  <div key={index} className="text-sm">
                    💡 {hint}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {codeOutput && lesson.content.testCases?.some((testCase: any) => codeOutput === testCase.expectedOutput) && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Отлично! Задание выполнено правильно. Переходим к следующему уроку.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'quiz': return <HelpCircle className="h-4 w-4" />
      case 'code': return <Code className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getLessonTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Видео'
      case 'text': return 'Текст'
      case 'quiz': return 'Тест'
      case 'code': return 'Код'
      default: return type
    }
  }

  const renderLessonContent = () => {
    if (!currentLesson) return null

    switch (currentLesson.type) {
      case 'video':
        return <VideoLesson lesson={currentLesson} />
      case 'text':
        return <TextLesson lesson={currentLesson} />
      case 'quiz':
        return <QuizLesson lesson={currentLesson} />
      case 'code':
        return <CodeLesson lesson={currentLesson} />
      default:
        return <div>Неподдерживаемый тип урока</div>
    }
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onExit}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к курсам
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="font-semibold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentLesson?.title} • {getLessonTypeName(currentLesson?.type || '')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {currentLessonIndex + 1} из {totalLessons}
              </div>
              <Progress value={courseProgress} className="w-32" />
              <span className="text-sm font-medium">{courseProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Содержание курса</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLessonIndex(index)}
                      className={cn(
                        'w-full text-left p-3 hover:bg-muted/50 transition-colors',
                        index === currentLessonIndex && 'bg-muted',
                        lessonProgress[lesson.id] && 'bg-green-50 border-l-2 border-l-green-500'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex items-center justify-center w-6 h-6 rounded-full text-xs',
                          lessonProgress[lesson.id] 
                            ? 'bg-green-500 text-white' 
                            : index === currentLessonIndex 
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-muted-foreground'
                        )}>
                          {lessonProgress[lesson.id] ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getLessonIcon(lesson.type)}
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {getLessonTypeName(lesson.type)}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">{lesson.title}</p>
                          {lesson.estimatedTime && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {lesson.estimatedTime} мин
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getLessonIcon(currentLesson?.type || '')}
                      {currentLesson?.title}
                    </CardTitle>
                    {currentLesson?.description && (
                      <p className="text-muted-foreground mt-1">{currentLesson.description}</p>
                    )}
                  </div>
                  
                  {lessonProgress[currentLesson?.id || ''] && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Завершен
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {renderLessonContent()}
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousLesson}
                disabled={currentLessonIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Предыдущий урок
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>+{course.rewards.points} XP за завершение курса</span>
              </div>
              
              <Button
                onClick={handleNextLesson}
                disabled={currentLessonIndex === totalLessons - 1}
              >
                Следующий урок
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseViewer