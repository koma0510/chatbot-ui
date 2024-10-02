"use client";

import { Box } from '@mui/material';
import { IconFileExport, IconMoon, IconSun } from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import { FC } from 'react'
import { Key } from '../Settings/Key'
import { ClearConversations } from './ClearConversations';


interface Props {
  apiKey: string
  conversationsCount : number
  onClearConversations : ()=>void 
  onApiKeyChange: (apiKey: string) => void
}

export const ChatbarSettings: FC<Props> = ({
  apiKey,
  conversationsCount,
  onClearConversations,
  onApiKeyChange,
}) => {
  const { t } = useTranslation('sidebar')

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversationsCount > 0 ? (
      <Box sx={{ p: 2 }}>
        <ClearConversations onClearConversations={onClearConversations} />
      </Box>
        
      ) : null}
      {/* <Key apiKey={apiKey} onApiKeyChange={onApiKeyChange} /> */}

    </div>
  )
}
