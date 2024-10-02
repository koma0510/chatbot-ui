
import { HomePage } from '@/components/Home/HomePage'
import { OpenAIModel, OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai'

  interface HomeProps {
    serverSideApiKeyIsSet: boolean
    defaultModelId: OpenAIModelID
  }

const Home: React.FC<HomeProps> = ({serverSideApiKeyIsSet,defaultModelId}) => {
  return (
    <HomePage
      serverSideApiKeyIsSet={serverSideApiKeyIsSet}  
      defaultModelId = {defaultModelId}
    />
  )
}
export default Home


