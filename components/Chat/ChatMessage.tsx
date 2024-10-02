"use client";

import { Message } from '@/types/chat'
import { IconCheck, IconCopy, IconEdit, IconUser, IconRobot } from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import { FC, memo, use, useEffect, useRef, useState } from 'react'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'
import rehypeRaw from 'rehype-raw'
import { 
  Box, Typography, IconButton, Avatar, Paper, TextField, Button,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import { Settings, Menu, Edit, SmartToy, ContentCopy, Refresh } from '@mui/icons-material';

interface Props {
  message: Message
  messageIndex: number
  onEditMessage: (message: Message, messageIndex: number) => void
}

export const ChatMessage: FC<Props> = memo(({ message, messageIndex, onEditMessage }) => {
  const { t } = useTranslation('chat')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [messageContent, setMessageContent] = useState(message.content)
  const [messagedCopied, setMessageCopied] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const toggleEditing = () => {
    setIsEditing(!isEditing)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(event.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleEditMessage = () => {
    // 変更があった場合
    if (message.content != messageContent) {
      onEditMessage({ ...message, content: messageContent }, messageIndex)
    }
    setIsEditing(false)
  }

  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
      e.preventDefault()
      handleEditMessage()
    }
  }

  const copyOnClick = () => {
    if (!navigator.clipboard) return

    navigator.clipboard.writeText(message.content).then(() => {
      setMessageCopied(true)
      setTimeout(() => {
        setMessageCopied(false)
      }, 2000)
    })
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [isEditing])

  // useEffect(() => {
  //   console.log('message.content', message.content)
  // }, [message.content])

  return (
    <div
      className={`group px-4 ${
        message.role === 'assistant'
          ? 'border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100'
          : 'border-b border-black/10 bg-white text-gray-800 dark:border-gray-900/50 dark:bg-[#343541] dark:text-gray-100'
      }`}
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="min-w-[40px] text-right font-bold">
          {message.role === 'assistant' ? <IconRobot size={30} /> : <IconUser size={30} />}
        </div>

        <div className="prose mt-[-2px] w-full dark:prose-invert">
          {message.role === 'user' ? (
            <div className="flex w-full">
              {/* 編集ボタンを押しているか否か　=> isEditing */}
              {isEditing ? (
                <div className="flex w-full flex-col">
                  <Paper
                    sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 20 }}
                  >
                    <TextField
                      inputRef={textareaRef}
                      fullWidth
                      variant="standard"
                      placeholder="LivAiGPT にメッセージを送信する"
                      value={messageContent}
                      onChange={handleInputChange}
                      InputProps={{
                        disableUnderline: true,
                        sx: { 
                          resize: 'none',
                          maxHeight: '400px',
                          overflow: textareaRef.current && textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden',
                          fontSize: '0.9rem',ml : 2 
                        }
                      }}
                      multiline
                      rows={1}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={()=>setIsTyping(false)}
                    />

                  </Paper>
                  <div className="mt-10 flex justify-center space-x-4">
                    <Button
                      variant='contained'
                      onClick={handleEditMessage}
                      disabled={messageContent.trim().length <= 0}
                    >
                      {t('Save & Submit')}
                    </Button>
                    <Button
                      variant='contained'
                      onClick={() => {
                        setMessageContent(message.content)
                        setIsEditing(false)
                      }}
                    >
                      {t('Cancel')}
                    </Button>
                  </div>
                  
                </div>
              ) : (
                <div className="prose whitespace-pre-wrap dark:prose-invert">{message.content}</div>
              )}
              {/* 編集モードじゃない時のボタン */}
              {(window.innerWidth > 640 || !isEditing) && (
                <IconButton size="small" onClick={toggleEditing}><Edit /></IconButton>
              )}
            </div>
          ) : (
            // 返答
            <>
               {messagedCopied ? (
                  <IconCheck size={20} />
                ) : (
                  <IconButton
                    onClick={copyOnClick}
                  >
                    <IconCopy size={20} />
                  </IconButton>
                )}

              <MemoizedReactMarkdown
                className="prose dark:prose-invert"
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeMathjax, rehypeRaw as any]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      {props.children}
                    </a>
                  ),
                  code({ node, inline, className, children, ...props }) {
                    // エラーメッセージの部分を赤色にする処理
                    if (children.length && typeof children[0] === 'string') {
                      const errorPattern = /error:.*/g
                      const text = children[0]
                      let match
                      if ((match = errorPattern.exec(text)) !== null) {
                        const errorMessage = match[0]
                        return (
                          <span className="text-red-500">
                            {errorMessage.replace('error:', '').replace('`', '')}
                          </span>
                        )
                      }
                    }

                    const match = /language-(\w+)/.exec(className || '')

                    return !inline ? (
                      <CodeBlock
                        key={Math.random()}
                        language={(match && match[1]) || ''}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  table({ children }) {
                    return (
                      <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                        {children}
                      </table>
                    )
                  },
                  th({ children }) {
                    return (
                      <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td className="border-ra break-words border border-black px-3 py-1 dark:border-white">
                        {children}
                      </td>
                    )
                  },
                }}
              >
                {message.content}
              </MemoizedReactMarkdown>
             
            </>
          )}
        </div>
      </div>
    </div>
  )
})
ChatMessage.displayName = 'ChatMessage'
