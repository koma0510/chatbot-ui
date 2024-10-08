import { IconCheck, IconTrash, IconX } from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import { FC, useState } from 'react'
import { SidebarButton } from '../Sidebar/SidebarButton'
import { Button } from '@mui/material'
import{
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTheme } from '@emotion/react'

interface Props {
  onClearConversations: () => void
}

export const ClearConversations: FC<Props> = ({ onClearConversations }) => {
  const theme = useTheme()
  const [isConfirming, setIsConfirming] = useState<boolean>(false)

  const { t } = useTranslation('sidebar')

  const handleClearConversations = () => {
    onClearConversations()
    setIsConfirming(false)
  }

  return isConfirming ? (
    <div className="flex w-full cursor-pointer items-center rounded-lg py-3 px-3 hover:bg-gray-500/10">
      <DeleteIcon/>

      <div className="ml-3 flex-1 text-left text-[12.5px] leading-3 text-white">
        {t('Are you sure?')}
      </div>

      <div className="flex w-[40px]">
        <IconCheck
          className="ml-auto mr-1 min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            handleClearConversations()
          }}
        />

        <IconX
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            setIsConfirming(false)
          }}
        />
      </div>
    </div>
  ) : (

   
    <Button
      variant="clearConversations"
      startIcon={<DeleteIcon />}
      fullWidth
      sx={{ justifyContent: 'flex-start' }}
      onClick={() => setIsConfirming(true)}
    >
      Clear Conversations
    </Button>

  )
}
