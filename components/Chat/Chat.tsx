"use client";

import { ErrorMessage } from '@/types/error'
import { OpenAIModel , OpenAIModelID } from '@/types/openai';
import { Conversation } from '@/types/chat';
import { Prompt } from '@/types/prompt';
import { Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { throttle } from '@/utils'
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { Spinner } from '../Global/Spinner';
import { ModelSelect } from './ModelSelect';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { memo , useState , useRef , FC , MutableRefObject ,useEffect} from 'react';
import { IconArrowDown, IconClearAll, IconSettings, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'next-i18next';
import { 
  Box, Typography, IconButton, Avatar, Paper, TextField, Button,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import { Settings, Menu, Edit, SmartToy, ContentCopy, Refresh } from '@mui/icons-material';

interface Props {
  conversation: Conversation
  models: OpenAIModel[]
  apiKey: string
  serverSideApiKeyIsSet: boolean
  defaultModelId: OpenAIModelID
  messageIsStreaming: boolean
  modelError: ErrorMessage | null
  loading: boolean
  onSend: (message: Message, deleteCount: number) => void
  onAbort: () => void
  onUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void
  onEditMessage: (message: Message, messageIndex: number) => void //Messageに保存されているメッセージを編集する
  stopConversationRef: MutableRefObject<boolean>
}

export const Chat: FC<Props> = memo(
  ({
    conversation,
    models,
    apiKey,
    serverSideApiKeyIsSet,
    defaultModelId,
    messageIsStreaming,
    modelError,
    loading,
    onSend,
    onAbort,
    onUpdateConversation,
    onEditMessage,
    stopConversationRef,
  }) => {
    const { t } = useTranslation('chat')
    const [currentMessage, setCurrentMessage] = useState<Message>()
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
    const [showSettings, setShowSettings] = useState<boolean>(false)
    const [showScrollDownButton, setShowScrollDownButton] = useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // const scrollToBottom = useCallback(() => {
    //   if (autoScrollEnabled) {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    //     textareaRef.current?.focus()
    //   }
    // }, [autoScrollEnabled])

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const bottomTolerance = 30

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false)
          setShowScrollDownButton(true)
        } else {
          setAutoScrollEnabled(true)
          setShowScrollDownButton(false)
        }
      }
    }

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }

    const handleSettings = () => {
      setShowSettings(!showSettings)
    }

    const onClearAll = () => {
      if (confirm(t('Are you sure you want to clear all messages?'))) {
        onUpdateConversation(conversation, { key: 'messages', value: [] })
      }
    }

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true)
      }
    }
    const throttledScrollDown = throttle(scrollDown, 250)

    useEffect(() => {
      throttledScrollDown()
      setCurrentMessage(conversation.messages[conversation.messages.length - 2])
    }, [conversation.messages, throttledScrollDown])

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry.isIntersecting)
          if (entry.isIntersecting) {
            textareaRef.current?.focus()
          }
        },
        {
          root: null,
          threshold: 0.5,
        }
      )
      const messagesEndElement = messagesEndRef.current
      if (messagesEndElement) {
        observer.observe(messagesEndElement)
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement)
        }
      }
    }, [messagesEndRef])

    return (
      <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
        {!(apiKey || serverSideApiKeyIsSet) ? (
          <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
            <div className="text-center text-lg text-black dark:text-white">
              <div className="mb-8">{`Chatbot UI is an open source clone of OpenAI's ChatGPT UI.`}</div>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="mb-2">
                {t('Please set your OpenAI API key .')}
              </div>
              <div>
                {t("If you don't have an OpenAI API key, you can get one here: ")}
                <a
                  href="https://platform.openai.com/account/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  openai.com
                </a>
              </div>
            </div>
          </div>
        ) : modelError ? (
          <ErrorMessageDiv error={modelError} />
        ) : (
          <>
            <div
              className="max-h-full overflow-x-hidden"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {conversation.messages.length === 0 ? (
                //ここから会話がまだない場合
                <> 
                  <div className="mx-auto flex w-[350px] flex-col space-y-10 pt-12 sm:w-[600px]">
                    <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                      {models.length === 0 && (
                        <div>
                          <Spinner size="16px" className="mx-auto" />
                        </div>
                      )}
                    </div>

                    {models.length > 0 && (
                      <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                        <ModelSelect
                          model={conversation.model}
                          models={models}
                          defaultModelId={defaultModelId}
                          onModelChange={(model) =>
                            onUpdateConversation(conversation, {
                              key: 'model',
                              value: model,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : ( //ここから会話がある場合
                <>
                  <Box sx={{ display: 'flex', 
                    alignItems: 'center', 
                    mb: 2 ,
                    justifyContent: 'flex-end',
                    position: 'fixed',
                    top: 0, 
                    left:240, 
                    width: `calc(100% - 240px)`, 
                    backgroundColor: '#f0f2f5', 
                    zIndex: 1100, 
                    p: 2 }}
                  >
                    <Typography variant="subtitle1" component="span" sx={{ mr: 1 }}>Model: {conversation.model.name}</Typography>
                    <IconButton size="small" onClick={handleSettings}><Settings /></IconButton>
                    <IconButton size="small" onClick={onClearAll}><IconTrash /></IconButton>
                  </Box>

                  {/* 設定ボタンが押された時 */}
                  {showSettings && (
                    <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                      <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                        <ModelSelect
                          model={conversation.model}
                          models={models}
                          defaultModelId={defaultModelId}
                          onModelChange={(model) =>
                            onUpdateConversation(conversation, {
                              key: 'model',
                              value: model,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  {/* 会話内容の表示 */}
                  {conversation.messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      messageIndex={index}
                      onEditMessage={onEditMessage}
                    />
                  ))}

                  {/* {loading && <ChatLoader />} */}

                  {/* <div className="h-[162px] bg-white dark:bg-[#343541]" ref={messagesEndRef} /> */}
                </>
              )}
            </div>
              {/* 入力欄 */}
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              messageIsStreaming={messageIsStreaming}
              conversationIsEmpty={conversation.messages.length === 0}
              model={conversation.model}
              onSend={(message:Message) => {
                setCurrentMessage(message)
                onSend(message, 0)
              }}
              onAbort={onAbort}
              onRegenerate={() => {
                if (currentMessage) {
                  onSend(currentMessage, 2)
                }
              }}
            />
          </>
        )}
        {showScrollDownButton && (
          <div className="absolute bottom-0 right-0 mb-4 mr-4 pb-20">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
              onClick={handleScrollDown}
            >
              <IconArrowDown size={18} />
            </button>
          </div>
        )}
      </div>
    )
  }
)
Chat.displayName = 'Chat'
