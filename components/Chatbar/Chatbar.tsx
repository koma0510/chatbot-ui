"use client";

import { Conversation } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { IconFolderPlus, IconMessagesOff, IconPlus } from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import { FC, useEffect, useState } from 'react'
import { ChatbarSettings } from './ChatbarSettings'
import { Divider , Button} from '@mui/material'
import { Conversations } from './Conversations';

interface Props {
  loading: boolean
  conversations : Conversation[]
  selectedConversation : Conversation
  apiKey: string
  onNewConversation: ()=> void
  onSelectConversation: (conversation:Conversation)=>void
  onDeleteConversation: (conversation:Conversation)=>void
  onClearConversations: () => void
  onUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void
  onApiKeyChange: (apiKey: string) => void
}

export const Chatbar: FC<Props> = ({
  loading,
  conversations,
  selectedConversation,
  apiKey,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onClearConversations,
  onUpdateConversation,
  onApiKeyChange,
}) => {
  const { t } = useTranslation('sidebar')
  const [searchTerm,setSearchTerm] = useState<string>('')
  const [filteredConversations,setFilteredConversation] = useState<Conversation[]>(conversations)

  const handleUpdateConversation = (conversation: Conversation, data: KeyValuePair) => {
    onUpdateConversation(conversation, data)
    setSearchTerm('')
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    onDeleteConversation(conversation)
    setSearchTerm('')
  }

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'))
      onUpdateConversation(conversation, { key: 'folderId', value: 0 })

      e.target.style.background = 'none'
    }
  }

  const allowDrop = (e: any) => {
    e.preventDefault()
  }

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541'
  }

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none'
  }

  // console.log("conversations in chatbar:",conversations)
  return (
    <div
      className={`fixed top-0 bottom-0 z-50 flex h-full w-[260px] flex-none flex-col space-y-2 bg-[#202123] p-2 transition-all sm:relative sm:top-0`}
    >
      <Divider style={{ borderColor: '#444444' }} />
      <div className="flex items-center">
        <Button
          variant='outlined'
          onClick={() => {
            onNewConversation()
            setSearchTerm('')
          }}
        >
          <IconPlus size={18} />
          {t('New chat')}
        </Button>
      </div>

      {/* {conversations.length > 1 && (
        <Search
          placeholder="Search conversations..."
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />
      )} */}

      <div className="flex-grow overflow-auto"> 
        {conversations.length > 0 ? (
            <div
              className="pt-2"
              onDrop={(e) => handleDrop(e)}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
            >
              <Conversations
                loading={loading}
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={onSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onUpdateConversation={handleUpdateConversation}
              />
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3 text-sm leading-normal text-white opacity-50">
              <IconMessagesOff />
              {t('No conversations.')}
            </div>
          )}
      </div>

      <ChatbarSettings
        apiKey={apiKey}
        conversationsCount={conversations.length }
        onClearConversations={onClearConversations}
        onApiKeyChange={onApiKeyChange}
      />
    </div>
  )
}