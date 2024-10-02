import { Conversation } from '@/types/chat'
import { OpenAIModelID, OpenAIModels } from '@/types/openai'
import { DEFAULT_SYSTEM_PROMPT } from './const'

export const cleanSelectedConversation = (conversation: Conversation) => {
  // added model for each conversation (3/20/23)
  // added system prompt for each conversation (3/21/23)
  // added folders (3/23/23)
  // added prompts (3/26/23)

  let updatedConversation = conversation

  // check for model on each conversation
  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || OpenAIModels[OpenAIModelID.GPT_3_5],
    }
  }

  return updatedConversation
}