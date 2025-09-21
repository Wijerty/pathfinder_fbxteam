'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Trophy,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'single_choice' | 'true_false' | 'text_input' | 'code_completion'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  timeLimit?: number // в секундах
}

interface QuizLessonProps {
  title: string
  description?: string
  questions: QuizQuestion[]
  passingScore?: number // процент для прохождения
  allowRetry?: boolean
  showCorrectAnswers?: boolean
  onComplete?: (score: number, passed: boolean) => void
  onProgress?: (progress: number) => void
  isCompleted?: boolean
  className?: string
}

interface UserAnswer {
  questionId: string
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

export function QuizLesson({
  title,
  description,
  questions,
  passingScore = 70,
  allowRetry = true,
  showCorrectAnswers = true,
  onComplete,
  onProgress,
  isCompleted = false,
  className = ''
}: QuizLessonProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('')
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  useEffect(() => {
    if (currentQuestion?.timeLimit) {
      setTimeLeft(currentQuestion.timeLimit)
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleNextQuestion()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentQuestionIndex])

  useEffect(() => {
    setQuestionStartTime(Date.now())
    setCurrentAnswer(currentQuestion?.type === 'multiple_choice' ? [] : '')
    setShowExplanation(false)
  }, [currentQuestionIndex])

  const checkAnswer = (questionId: string, userAnswer: string | string[], correctAnswer: string | string[]) => {
    if (Array.isArray(correctAnswer)) {
      if (!Array.isArray(userAnswer)) return false
      return correctAnswer.length === userAnswer.length && 
             correctAnswer.every(answer => userAnswer.includes(answer))
    }
    return userAnswer === correctAnswer
  }

  const handleAnswerChange = (answer: string, isMultiple = false) => {
    if (isMultiple) {
      const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : []
      if (currentAnswers.includes(answer)) {
        setCurrentAnswer(currentAnswers.filter(a => a !== answer))
      } else {
        setCurrentAnswer([...currentAnswers, answer])
      }
    } else {
      setCurrentAnswer(answer)
    }
  }

  const handleNextQuestion = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const isCorrect = checkAnswer(currentQuestion.id, currentAnswer, currentQuestion.correctAnswer)
    
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      isCorrect,
      timeSpent
    }

    const newAnswers = [...userAnswers, userAnswer]
    setUserAnswers(newAnswers)

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      onProgress?.((currentQuestionIndex + 2) / totalQuestions * 100)
    } else {
      // Завершение квиза
      const correctAnswers = newAnswers.filter(a => a.isCorrect).length
      const finalScore = Math.round((correctAnswers / totalQuestions) * 100)
      const passed = finalScore >= passingScore
      
      setScore(finalScore)
      setIsQuizCompleted(true)
      setShowResults(true)
      onComplete?.(finalScore, passed)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Восстанавливаем предыдущий ответ
      const prevAnswer = userAnswers[currentQuestionIndex - 1]
      if (prevAnswer) {
        setCurrentAnswer(prevAnswer.answer)
      }
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setCurrentAnswer('')
    setIsQuizCompleted(false)
    setScore(0)
    setShowResults(false)
    setShowExplanation(false)
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    switch (currentQuestion.type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleAnswerChange(option)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                  onChange={() => handleAnswerChange(option, true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="answer"
                value="true"
                checked={currentAnswer === 'true'}
                onChange={() => handleAnswerChange('true')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Верно</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="answer"
                value="false"
                checked={currentAnswer === 'false'}
                onChange={() => handleAnswerChange('false')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Неверно</span>
            </label>
          </div>
        )

      case 'text_input':
        return (
          <div>
            <textarea
              value={currentAnswer as string}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="w-full p-3 border rounded-lg resize-none h-24"
            />
          </div>
        )

      case 'code_completion':
        return (
          <div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-3">
              <pre>{currentQuestion.question}</pre>
            </div>
            <textarea
              value={currentAnswer as string}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Введите код..."
              className="w-full p-3 border rounded-lg resize-none h-32 font-mono text-sm"
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderResults = () => {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length
    const passed = score >= passingScore

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
            passed ? 'bg-green-100' : 'bg-red-100'
          )}>
            {passed ? (
              <Trophy className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {passed ? 'Поздравляем!' : 'Попробуйте еще раз'}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            Ваш результат: {score}% ({correctAnswers} из {totalQuestions})
          </p>
          
          <div className="text-sm text-muted-foreground">
            Для прохождения требуется: {passingScore}%
          </div>
        </div>

        {showCorrectAnswers && (
          <div className="space-y-4">
            <h4 className="font-semibold">Разбор ответов:</h4>
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index]
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      userAnswer?.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    )}>
                      {userAnswer?.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Ваш ответ: </span>
                          <span className={userAnswer?.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {Array.isArray(userAnswer?.answer) 
                              ? userAnswer.answer.join(', ') 
                              : userAnswer?.answer}
                          </span>
                        </div>
                        {!userAnswer?.isCorrect && (
                          <div>
                            <span className="text-muted-foreground">Правильный ответ: </span>
                            <span className="text-green-600">
                              {Array.isArray(question.correctAnswer) 
                                ? question.correctAnswer.join(', ') 
                                : question.correctAnswer}
                            </span>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                            <strong>Объяснение:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {allowRetry && !passed && (
          <div className="text-center">
            <Button onClick={restartQuiz} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Пройти заново
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (showResults) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Результаты теста: {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              Вопрос {currentQuestionIndex + 1} из {totalQuestions}
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{timeLeft}с</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentQuestion && (
          <>
            <div>
              <h3 className="text-lg font-medium mb-4">
                {currentQuestion.question}
              </h3>
              {renderQuestion()}
            </div>

            {currentQuestion.explanation && showExplanation && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Объяснение:</p>
                    <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>

              <div className="flex items-center gap-2">
                {currentQuestion.explanation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExplanation(!showExplanation)}
                  >
                    {showExplanation ? 'Скрыть' : 'Показать'} объяснение
                  </Button>
                )}
                
                <Button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
                  className="flex items-center gap-2"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Завершить' : 'Далее'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default QuizLesson