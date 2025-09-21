'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Code2, 
  Terminal, 
  Lightbulb,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestCase {
  input: string
  expectedOutput: string
  description?: string
  isHidden?: boolean
}

interface CodeLessonProps {
  title: string
  description?: string
  initialCode?: string
  solution?: string
  testCases: TestCase[]
  hints?: string[]
  allowSolutionView?: boolean
  onComplete?: (code: string, passed: boolean) => void
  onProgress?: (progress: number) => void
  isCompleted?: boolean
  className?: string
}

interface TestResult {
  passed: boolean
  output: string
  error?: string
  executionTime: number
}

export function CodeLesson({
  title,
  description,
  initialCode = '# Напишите ваш код здесь\nprint("Hello, World!")',
  solution,
  testCases,
  hints = [],
  allowSolutionView = true,
  onComplete,
  onProgress,
  isCompleted = false,
  className = ''
}: CodeLessonProps) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [showHints, setShowHints] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [showTestCases, setShowTestCases] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const visibleTestCases = testCases.filter(tc => !tc.isHidden)
  const allTestsPassed = testResults.length > 0 && testResults.every(result => result.passed)
  const progress = testResults.length > 0 ? (testResults.filter(r => r.passed).length / testCases.length) * 100 : 0

  useEffect(() => {
    if (allTestsPassed && testResults.length === testCases.length) {
      onComplete?.(code, true)
      onProgress?.(100)
    } else {
      onProgress?.(progress)
    }
  }, [testResults, allTestsPassed, code, onComplete, onProgress, progress, testCases.length])

  // Симуляция выполнения Python кода
  const executePythonCode = async (codeToRun: string, input?: string): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      // Здесь должна быть интеграция с реальным Python интерпретатором
      // Для демонстрации используем простую симуляцию
      
      // Простая симуляция выполнения кода
      let output = ''
      let error = ''
      
      // Базовая обработка print statements
      const printMatches = codeToRun.match(/print\(([^)]+)\)/g)
      if (printMatches) {
        printMatches.forEach(match => {
          const content = match.match(/print\(([^)]+)\)/)?.[1]
          if (content) {
            // Убираем кавычки если это строка
            const cleanContent = content.replace(/["']/g, '')
            output += cleanContent + '\n'
          }
        })
      }
      
      // Проверка на базовые ошибки синтаксиса
      if (codeToRun.includes('print(') && !codeToRun.includes(')')) {
        error = 'SyntaxError: unexpected EOF while parsing'
      }
      
      // Симуляция математических операций
      const mathMatches = codeToRun.match(/print\((\d+\s*[+\-*/]\s*\d+)\)/g)
      if (mathMatches) {
        mathMatches.forEach(match => {
          const expression = match.match(/print\((\d+\s*[+\-*/]\s*\d+)\)/)?.[1]
          if (expression) {
            try {
              const result = eval(expression)
              output = output.replace(expression, result.toString())
            } catch (e) {
              error = 'Error in mathematical expression'
            }
          }
        })
      }
      
      const executionTime = Date.now() - startTime
      
      return {
        passed: !error,
        output: output.trim(),
        error: error || undefined,
        executionTime
      }
    } catch (e) {
      return {
        passed: false,
        output: '',
        error: e instanceof Error ? e.message : 'Unknown error',
        executionTime: Date.now() - startTime
      }
    }
  }



  const runCode = useCallback(async () => {
    setIsRunning(true)
    setOutput('')
    
    try {
      const result = await executePythonCode(code)
      setOutput(result.output || result.error || 'No output')
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }, [code])

  const runTests = useCallback(async () => {
    setIsRunning(true)
    const results: TestResult[] = []
    
    for (const testCase of testCases) {
      try {
        const result = await executePythonCode(code, testCase.input)
        const passed = result.output.trim() === testCase.expectedOutput.trim()
        results.push({
          ...result,
          passed
        })
      } catch (error) {
        results.push({
          passed: false,
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0
        })
      }
    }
    
    setTestResults(results)
    setIsRunning(false)
  }, [code, testCases])

  const resetCode = useCallback(() => {
    setCode(initialCode)
    setOutput('')
    setTestResults([])
    setShowSolution(false)
  }, [initialCode])

  const showNextHint = useCallback(() => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1)
    }
  }, [currentHintIndex, hints.length])

  const loadSolution = useCallback(() => {
    if (solution) {
      setCode(solution)
      setShowSolution(true)
    }
  }, [solution])

  const downloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [code, title])

  const uploadCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCode(content)
      }
      reader.readAsText(file)
    }
  }, [])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newCode = code.substring(0, start) + '    ' + code.substring(end)
        setCode(newCode)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4
        }, 0)
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runCode()
    }
  }, [code, runCode])

  return (
    <Card className={cn('overflow-hidden', isFullscreen && 'fixed inset-0 z-50', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              >
                A-
              </Button>
              <span className="text-xs px-1">{fontSize}px</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              >
                A+
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс тестов</span>
              <span className="text-sm text-muted-foreground">
                {testResults.filter(r => r.passed).length} / {testCases.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={cn('grid gap-4', isFullscreen ? 'grid-cols-1 h-[calc(100vh-200px)]' : 'grid-cols-1 lg:grid-cols-2')}>
          {/* Редактор кода */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Редактор кода</h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".py"
                  onChange={uploadCode}
                  className="hidden"
                  id="upload-code"
                />
                <label htmlFor="upload-code">
                  <Button variant="ghost" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                
                <Button variant="ghost" size="sm" onClick={downloadCode}>
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={resetCode}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className={cn(
              'relative rounded-lg border overflow-hidden',
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            )}>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full h-64 p-4 font-mono resize-none border-0 outline-none',
                  theme === 'dark' 
                    ? 'bg-gray-900 text-green-400' 
                    : 'bg-white text-gray-900'
                )}
                style={{ fontSize: `${fontSize}px` }}
                placeholder="Напишите ваш Python код здесь..."
                spellCheck={false}
              />
              
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                Ctrl+Enter для запуска
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={runCode} disabled={isRunning} className="flex items-center gap-2">
                {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Выполняется...' : 'Запустить'}
              </Button>
              
              <Button onClick={runTests} disabled={isRunning} variant="outline" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Проверить тесты
              </Button>
              
              {hints.length > 0 && (
                <Button 
                  onClick={() => setShowHints(!showHints)} 
                  variant="ghost" 
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Подсказки
                </Button>
              )}
              
              {allowSolutionView && solution && (
                <Button 
                  onClick={loadSolution} 
                  variant="ghost" 
                  className="flex items-center gap-2"
                >
                  {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Решение
                </Button>
              )}
            </div>
          </div>
          
          {/* Вывод и тесты */}
          <div className="space-y-4">
            {/* Вывод программы */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Вывод программы
              </h3>
              <div className={cn(
                'p-4 rounded-lg border font-mono text-sm h-32 overflow-auto',
                theme === 'dark' 
                  ? 'bg-gray-900 text-green-400' 
                  : 'bg-gray-50 text-gray-900'
              )}>
                <pre className="whitespace-pre-wrap">{output || 'Нажмите "Запустить" для выполнения кода'}</pre>
              </div>
            </div>
            
            {/* Результаты тестов */}
            {testResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Результаты тестов</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTestCases(!showTestCases)}
                  >
                    {showTestCases ? 'Скрыть' : 'Показать'} детали
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {testResults.map((result, index) => {
                    const testCase = testCases[index]
                    return (
                      <div key={index} className={cn(
                        'p-3 rounded-lg border',
                        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      )}>
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            Тест {index + 1}
                            {testCase.description && `: ${testCase.description}`}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {result.executionTime}ms
                          </span>
                        </div>
                        
                        {showTestCases && !testCase.isHidden && (
                          <div className="mt-2 text-xs space-y-1">
                            {testCase.input && (
                              <div>
                                <span className="font-medium">Ввод: </span>
                                <code className="bg-gray-100 px-1 rounded">{testCase.input}</code>
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Ожидаемый вывод: </span>
                              <code className="bg-gray-100 px-1 rounded">{testCase.expectedOutput}</code>
                            </div>
                            <div>
                              <span className="font-medium">Ваш вывод: </span>
                              <code className={cn(
                                'px-1 rounded',
                                result.passed ? 'bg-green-100' : 'bg-red-100'
                              )}>
                                {result.output || result.error}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {allTestsPassed && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Отлично! Все тесты пройдены!</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Подсказки */}
            {showHints && hints.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800">Подсказка {currentHintIndex + 1}</h4>
                  {currentHintIndex < hints.length - 1 && (
                    <Button size="sm" onClick={showNextHint}>
                      Следующая подсказка
                    </Button>
                  )}
                </div>
                <p className="text-sm text-blue-700">{hints[currentHintIndex]}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CodeLesson