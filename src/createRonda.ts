import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import {
  type DistanceStrategy,
  PGVectorStore
} from '@langchain/community/vectorstores/pgvector'
import { OllamaEmbeddings } from '@langchain/ollama'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { config } from './config/config'
import { PostgresConnection } from './infrastructure/PostgresConnection'

async function createDatabase (pgConnection: PostgresConnection): Promise<void> {
  await pgConnection.sql`CREATE EXTENSION IF NOT EXISTS vector;`
  await pgConnection.sql`DROP SCHEMA IF EXISTS ronda CASCADE;`
  await pgConnection.sql`CREATE SCHEMA ronda;`
}

async function main (
  pgConnection: PostgresConnection,
  vectorStorePromise: Promise<PGVectorStore>
): Promise<void> {
  console.log('Starting creation process')
  await createDatabase(pgConnection)
  console.log('Database created')
  const directoryLoader = new DirectoryLoader('./data/ronda', {
    '.pdf': (path: string): PDFLoader =>
      new PDFLoader(path)
  })
  const documents = await directoryLoader.load()
  // This hack avoids storing a huge amont of parsing errors that drives the model crazy
  documents.forEach((document, index) => {
    delete document.metadata.pdf.metadata
  })

  console.log(`${documents.length} documents loaded`)
  const vectorStore = await vectorStorePromise
  console.log('Vector store initialized')
  await vectorStore.addDocuments(documents)
  console.log('Documents added to vector store')
  await vectorStore.end()
  console.log('Done!')
}

const pgConnection = new PostgresConnection()
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

main(pgConnection, vectorStore)
  .catch((error) => {
    console.error(error)
  })
