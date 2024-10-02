"use client";

import { Message } from '@/types/chat'
import { OpenAIModel } from '@/types/openai'
import {
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import {
  FC,
  KeyboardEvent,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { TextField, Paper, Typography, IconButton, CircularProgress ,Button} from '@mui/material';
import { AttachFile, Send, StopRounded ,Refresh} from '@mui/icons-material';

interface Props {
  messageIsStreaming: boolean
  model: OpenAIModel
  conversationIsEmpty: boolean
  onSend: (message: Message) => void
  onAbort: () => void
  onRegenerate: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export const ChatInput: FC<Props> = ({
  messageIsStreaming,
  model,
  conversationIsEmpty,
  onSend,
  onAbort,
  onRegenerate,
  stopConversationRef,
  textareaRef,
}) => {
  const { t } = useTranslation('chat')

  const [content, setContent] = useState<string>()
  const [isTyping, setIsTyping] = useState<boolean>(false)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const maxLength = model.maxLength

    if (value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length }
        )
      )
      return
    }

    setContent(value)
  }

  const handleSend = () => {
    if (messageIsStreaming) {
      return
    }

    if (!content) {
      alert(t('Please enter a message'))
      return
    }
    
    onSend({ role: 'user', content })
    setContent('')

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur()
    }
  }

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  const isMobile = () => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    return mobileRegex.test(userAgent)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`
    }
  }, [content])

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2">
      <div>

        {!messageIsStreaming && !conversationIsEmpty && (
          <Button variant="outlined" startIcon={<Refresh />} size="small" onClick={onRegenerate}>
                Regenerate response
          </Button>
        )}

        <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4">

          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              m: 2, 
              maxWidth: 600, 
              mx: 'auto', 
              borderRadius: 4,
              backgroundColor: '#f8f9fa',
              position: 'fixed',
              bottom: 0,
              left: 150,
              right: 0,
              zIndex: 1000
            }}
          >
            <Typography 
              sx={{ mb: 2, color: 'text.secondary', textAlign: 'center', fontSize:'0.75rem' }}
            >
              LivAiGPT の回答は必ずしも正しいとは限りません。重要な情報は確認するようにしてください。
            </Typography>
            <Paper
              sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 20 }}
            >
              <TextField
                inputRef={textareaRef}
                fullWidth
                variant="standard"
                placeholder="LivAiGPT にメッセージを送信する"
                value={content}
                onChange={handleChange}
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
              
              {messageIsStreaming ? (
                <IconButton type="button" sx={{ p: '10px' }} onClick={onAbort}
                >
                  <StopRounded />
                </IconButton>
              ) : (             
                <IconButton type="submit" sx={{ p: '10px' }} aria-label="send" onClick={handleSend}> 
                <IconSend />
                </IconButton>
              )}
                  
              
            </Paper>
      </Paper>
          
        </div>
      </div>
    </div>
  )
}
