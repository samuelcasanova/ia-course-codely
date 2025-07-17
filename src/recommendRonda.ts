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
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

async function main (
  model: string,
  query: string,
  vectorStorePromise: Promise<PGVectorStore>
): Promise<void> {
  const vectorStore = await vectorStorePromise

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate('You are an advanced magazine content recommender'),
    // Based on: https://smith.langchain.com/hub/rlm/rag-prompt
    HumanMessagePromptTemplate.fromTemplate(
        `
Your task is to recommend a relevant magazine article based on the user's query.
You need to answer to the user: 
  - the title of the most relevant article
  - an excerpt of the article (1-2 sentences)
  - the PDF file name, located at the pdf.info.title field in the metadata column of the vector store
  - the page number of the article, located at the loc.pageNumber field in the metadata column of the vector store
Use the following pieces of retrieved context to answer the question. Don't use other sources to answer other than the provided context.
If you don't know the answer, just say that you don't know.
Use three sentences maximum and keep the answer concise.
Question: {question} 
Context: {context} 
Answer:
        `.trim()
    )
  ])

  const aiModel = new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash-lite', apiKey: process.env.GOOGLE_GENAI_API_KEY as string, temperature: 1 })

  const declarativeRagChain = RunnableSequence.from([
    {
      context: vectorStore.asRetriever().pipe(formatDocumentsAsString),
      question: new RunnablePassthrough()
    },
    chatPrompt,
    model === 'gemini'
      ? new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash-lite', apiKey: process.env.GOOGLE_GENAI_API_KEY as string, temperature: 1 })
      : new ChatOllama({ model: 'llama3.2:3b', temperature: 0.5 }),
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

const model = process.argv[2]
const query = process.argv[3]

main(model, query, vectorStore)
  .catch((error) => {
    console.error(error)
  })
