"use client";

import { 
  AppBar, 
  Drawer,
  Toolbar, 
  Typography, 
  Box, 
  Container,
  ThemeProvider,
  CssBaseline
} from '@mui/material';

import { Chat } from '@/components/Chat/Chat'
import { Chatbar } from '@/components/Chatbar/Chatbar'

import { ChatBody, Conversation, Message } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { ErrorMessage } from '@/types/error'
// import { LatestExportFormat, SupportedExportFormats } from '@/types/export'
import { OpenAIModel, OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai'
import { cleanSelectedConversation } from '@/utils/app/clean';

import { Prompt } from '@/types/prompt'
// import { cleanConversationHistory, cleanSelectedConversation } from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const'
import { saveConversation, saveConversations, updateConversation } from '@/utils/app/conversation'
// import { exportData, importData } from '@/utils/app/importExport'
import { useTranslation } from 'next-i18next'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const drawerWidth = 240;

interface HomePageProps {
  serverSideApiKeyIsSet: boolean
  defaultModelId: OpenAIModelID
}

export const HomePage: React.FC<HomePageProps> = ({ serverSideApiKeyIsSet}) => {
  const { t } = useTranslation('chat')
  const defaultModelId = OpenAIModelID.GPT_4

  // STATE ----------------------------------------------

  const [apiKey, setApiKey] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false)

  const [modelError, setModelError] = useState<ErrorMessage | null>(null)

  const [models, setModels] = useState<OpenAIModel[]>([])



  const [conversations, setConversations] = useState<Conversation[]>([]) 
  const [selectedConversation, setSelectedConversation] = useState<Conversation>() 
  const [currentMessage, setCurrentMessage] = useState<Message>() 


  const [controller, setController] = useState<AbortController | null>(null)
  const handleAbort = () => {
    if (controller) {
      controller.abort() // リクエストの中止
    }
  }
  //ここまで

  // REFS ----------------------------------------------

  const stopConversationRef = useRef<boolean>(false)

  // FETCH RESPONSE ----------------------------------------------

  const handleSend = async (message: Message, deleteCount = 0) => {
    const newController = new AbortController()
    setController(newController)

    if (selectedConversation) {
      let updatedConversation: Conversation

      if (deleteCount) {
        const updatedMessages = [...selectedConversation.messages]
        for (let i = 0; i < deleteCount; i++) {
          updatedMessages.pop()
        }

        updatedConversation = {
          ...selectedConversation,
          messages: [...updatedMessages, message],
        }
      } else {
        updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
        }
      }

      setSelectedConversation(updatedConversation)
      setLoading(true)
      setMessageIsStreaming(true)

      const chatBody: ChatBody = {
        model: updatedConversation.model,
        messages: updatedConversation.messages,
        key: apiKey,
      }

      const endpoint = '/api/chat'
      let body
      
      body = JSON.stringify(chatBody)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: newController.signal,
          body,
        })

        if (!response.ok) {
          setLoading(false)
          setMessageIsStreaming(false)
          toast.error(response.statusText)
          throw new Error(response.statusText)
        }

        const data = response.body

        if (!data) {
          setLoading(false)
          setMessageIsStreaming(false)
          throw new Error('No data received')
        }

        if (updatedConversation.messages.length === 1) {
          const { content } = message
          const customName = content.length > 30 ? content.substring(0, 30) + '...' : content

          updatedConversation = {
            ...updatedConversation,
            name: customName,
          }
        }

        setLoading(false)

        const reader = data.getReader()
        const decoder = new TextDecoder('utf-8')
        let done = false
        let isFirst = true
        let text = ''

        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunkValue = decoder.decode(value, { stream: true })
          console.log('chunkValue:', chunkValue)

          text += chunkValue

          if (isFirst) {
            isFirst = false
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: chunkValue },
            ]

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            }

            setSelectedConversation(updatedConversation)
          } else {
            const updatedMessages: Message[] = updatedConversation.messages.map(
              (message, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  return {
                    ...message,
                     content: text,
                  }
                }

                return message
              }
              )

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            }

             setSelectedConversation(updatedConversation)
          }
        }

        saveConversation(updatedConversation)
        // console.log("conversations:",conversations)

        const updatedConversations: Conversation[] = conversations.map((conversation) => {
          // console.log("Moved")
          if (conversation.id === selectedConversation.id) {
            return updatedConversation
          }
          return conversation
        })
        // 初めての会話スレッドの作成
        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation)
          // console.log("move")
        }
        
        console.log("conversations:",updatedConversations)
        setConversations(updatedConversations)
        saveConversations(updatedConversations)

        setMessageIsStreaming(false)
      } catch (error: any) {
        let AbortErrorFlag = false
        setLoading(false)
        setMessageIsStreaming(false)
        let errorText = ''
        // エラーメッセージ設計
        if (error.name === 'AbortError') {
          console.log('error:回答生成がストップされました。')
          AbortErrorFlag = true
        } else {
          console.error(error)
          errorText =
            '`申し訳ございません。通信の際に問題が発生しております。ページを再度読み込みして、もう一度お試しください。`'
        }
        if (updatedConversation.messages[updatedConversation.messages.length - 1].role === 'user') {
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: `${errorText}` },
          ]
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          }
        } else {
          const updatedMessages: Message[] = updatedConversation.messages.map((message, index) => {
            if (index === updatedConversation.messages.length - 1) {
              return {
                ...message,
                content: `${message.content + '\n\n' + errorText}`,
              }
            }
            return message
          })
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          }
        }
        setSelectedConversation(updatedConversation)
        // 回答ストップの際だけ履歴に追加
        if (AbortErrorFlag) {
          let newThreadFlag = true
          const updatedConversations: Conversation[] = conversations.map((conversation) => {
            if (conversation.id === selectedConversation.id) {
              newThreadFlag = false
              return updatedConversation
            }
            return conversation
          })
          if (newThreadFlag) {
            updatedConversations.push(updatedConversation)
          }
          setConversations(updatedConversations)
          saveConversations(updatedConversations)
        }
      }
    }
  }



  // FETCH MODELS ----------------------------------------------

  const fetchModels = async (key: string) => {
    const error = {
      title: t('Error fetching models.'),
      code: null,
      messageLines: [
        t('Make sure your OpenAI API key is set in the bottom left of the sidebar.'),
        t('If you completed this step, OpenAI may be experiencing issues.'),
      ],
    } as ErrorMessage

    const response = await fetch('/api/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
      }),
    })

    if (!response.ok) {
      try {
        const data = await response.json()
        Object.assign(error, {
          code: data.error?.code,
          messageLines: [data.error?.message],
        })
        
      } catch (e) {}
      setModelError(error)
      return
    }

    const data = await response.json()

    if (!data) {
      setModelError(error)
      return
    }
    
    setModels(data)
    setModelError(null)
  }

  // BASIC HANDLERS --------------------------------------------

  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey)
    localStorage.setItem('apiKey', apiKey)
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    saveConversation(conversation)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    const newConversation: Conversation = {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
    }

    const updatedConversations = [...conversations, newConversation]

    setSelectedConversation(newConversation)
    setConversations(updatedConversations)

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    setLoading(false)
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter((c) => c.id !== conversation.id)
    setConversations(updatedConversations)
    saveConversations(updatedConversations)

    if (updatedConversations.length > 0) {
      setSelectedConversation(updatedConversations[updatedConversations.length - 1])
      saveConversation(updatedConversations[updatedConversations.length - 1])
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: OpenAIModels[defaultModelId],
      })
      localStorage.removeItem('selectedConversation')
    }
  }

  const handleUpdateConversation = (conversation: Conversation, data: KeyValuePair) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    }

    const { single, all } = updateConversation(updatedConversation, conversations)

    setSelectedConversation(single)
    setConversations(all)
  }

  const handleClearConversations = () => {
    setConversations([])
    localStorage.removeItem('conversationHistory')

    setSelectedConversation({
      id: uuidv4(),
      name: 'New conversation',
      messages: [],
      model: OpenAIModels[defaultModelId],
    })
    localStorage.removeItem('selectedConversation')
  }

  const handleEditMessage = (message: Message, messageIndex: number) => {
    if (selectedConversation) {
      const updatedMessages = selectedConversation.messages
        .map((m, i) => {
          if (i < messageIndex) {
            return m
          }
        })
        .filter((m) => m) as Message[]

      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
      }

      const { single, all } = updateConversation(updatedConversation, conversations)

      setSelectedConversation(single)
      setConversations(all)

      setCurrentMessage(message)
    }
  }

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (currentMessage) {
      handleSend(currentMessage)
      setCurrentMessage(undefined)
    }
  }, [currentMessage])

  useEffect(() => {
    if (apiKey) {
      fetchModels(apiKey)
    }
  }, [apiKey])

  // ON LOAD --------------------------------------------

  useEffect(() => {
    // console.log("moved")
    const apiKey = localStorage.getItem('apiKey')
    if (serverSideApiKeyIsSet) {
      fetchModels('')
      setApiKey('')
      localStorage.removeItem('apiKey')
    } else if (apiKey) {
      setApiKey(apiKey)
      fetchModels(apiKey)
    }

    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] = JSON.parse(conversationHistory)
      // const cleanedConversationHistory = cleanConversationHistory(parsedConversationHistory)
      // setConversations(cleanedConversationHistory)
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation = JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(parsedSelectedConversation)
      setSelectedConversation(cleanedSelectedConversation)
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: OpenAIModels[defaultModelId],
      })
      
    }
  }, [serverSideApiKeyIsSet])

  return (
      <Box sx={{ display: 'flex', height: '100vh' }}>
          {selectedConversation && (
          <>
              <Drawer 
                variant="permanent"
                sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
               }}
              >
                <Toolbar>
                  <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                   LivAI GPT
                  </Typography>
                </Toolbar>
                <Box sx={{ overflow: 'auto', p: 2 }}>
                
                    <Chatbar 
                      loading={messageIsStreaming} 
                      conversations={conversations}
                      selectedConversation={selectedConversation}
                      apiKey={apiKey} 
                      onNewConversation={handleNewConversation}
                      onSelectConversation={handleSelectConversation}
                      onDeleteConversation={handleDeleteConversation}
                      onClearConversations={handleClearConversations}
                      onUpdateConversation={handleUpdateConversation}
                      onApiKeyChange={handleApiKeyChange}
                    />
             
                </Box>
              </Drawer>
              <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${drawerWidth}px)`, display: 'flex', flexDirection: 'column' }}>
              <Toolbar />
              <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* <Box sx={{ display: 'flex', 
                    alignItems: 'center', 
                    mb: 2 , 
                    position: 'fixed',top: 0, 
                    left: 100, 
                    width: '100%', 
                    backgroundColor: 'background.paper', 
                    zIndex: 1100, 
                    p: 2 }}
                  >
                    <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
                      LivAiGPT
                    </Typography>
                  </Box> */}
                  <Chat
                    conversation={selectedConversation}
                    messageIsStreaming={messageIsStreaming}
                    apiKey={apiKey}
                    serverSideApiKeyIsSet={serverSideApiKeyIsSet}
                    defaultModelId={defaultModelId}
                    modelError={modelError}
                    models={models}
                    loading={loading}
                    onSend={handleSend}
                    onAbort={handleAbort}
                    onUpdateConversation={handleUpdateConversation}
                    onEditMessage={handleEditMessage}
                    stopConversationRef={stopConversationRef}
                  />
                </Container>
              </Box>
            </>
          )}
        
      </Box>  
  )
}
