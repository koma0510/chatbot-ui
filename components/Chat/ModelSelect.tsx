"use client";

import { OpenAIModel, OpenAIModelID } from '@/types/openai'
import { useTranslation } from 'next-i18next'
import { IconExternalLink } from '@tabler/icons-react'
import { FC } from 'react'
import { useTheme } from '@mui/material';
import{ Select , MenuItem , FormControl , InputLabel} from '@mui/material'

interface Props {
  model: OpenAIModel
  models: OpenAIModel[]
  defaultModelId: OpenAIModelID
  onModelChange: (model: OpenAIModel) => void
}

export const ModelSelect: FC<Props> = ({ model, models, defaultModelId, onModelChange }) => {
  const { t } = useTranslation('chat')


  return (
    <div className="flex flex-col">
      {/* <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">{t('Model')}</label> */}

      <FormControl fullWidth variant="outlined">
        <InputLabel>{t('Model')}</InputLabel>
        <Select
          value={model?.id || defaultModelId}
          onChange={(e) => {
            onModelChange(models.find((model) => model.id === e.target.value) as OpenAIModel)
          }}
          label={t('Model')}
        >
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {model.id === defaultModelId ? `Default (${model.name})`:model.name}
            </MenuItem> 
          ))}
        </Select>
      </FormControl>

      <div className="mt-3 flex w-full items-center text-left text-neutral-700 dark:text-neutral-400">
        <a
          href="https://platform.openai.com/account/usage"
          target="_blank"
          className="flex items-center"
        >
          <IconExternalLink size={18} className={'mr-1 inline'} />
          {t('View Account Usage')}
        </a>
      </div>
    </div>
  )
}
