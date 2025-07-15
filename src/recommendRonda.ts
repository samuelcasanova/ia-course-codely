import {
  type DistanceStrategy,
  PGVectorStore
} from '@langchain/community/vectorstores/pgvector'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts'
import {
  RunnablePassthrough,
  RunnableSequence
} from '@langchain/core/runnables'
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { formatDocumentsAsString } from 'langchain/util/document'
import { config } from './config/config'

async function main (
  query: string,
  vectorStorePromise: Promise<PGVectorStore>
): Promise<void> {
  const vectorStore = await vectorStorePromise

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate('You are an advanced magazine content recommender'),
    // Based on: https://smith.langchain.com/hub/rlm/rag-prompt
    HumanMessagePromptTemplate.fromTemplate(
        `
Your task is to recommend a magazine article based on the user's query.
You need to point the user to the title and the page number of the most relevant article in the magazine.
Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know.
Use three sentences maximum and keep the answer concise.
Question: {question} 
Context: {context} 
Answer:
        `.trim()
    )
  ])

  const declarativeRagChain = RunnableSequence.from([
    {
      context: vectorStore.asRetriever().pipe(formatDocumentsAsString),
      question: new RunnablePassthrough()
    },
    chatPrompt,
    new ChatOllama({ model: 'llama3.2:3b', temperature: 0.5 }),
    new StringOutputParser()
  ])

  const response = await declarativeRagChain.invoke(query)
  console.log(response)

  await vectorStore.end()
  console.log('Done!')
}

const vectorStore = PGVectorStore.initialize(
  new OllamaEmbeddings({
    model: 'nomic-embed-text',
    baseUrl: 'http://localhost:11434'
  }),
  {
    postgresConnectionOptions: config.db,
    tableName: 'ronda.magazines',
    columns: {
      idColumnName: 'id',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
      vectorColumnName: 'embedding'
    },
    distanceStrategy: 'cosine' as DistanceStrategy
  }
)

main(process.argv[2], vectorStore)
  .catch((error) => {
    console.error(error)
  })
