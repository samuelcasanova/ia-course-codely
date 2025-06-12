import { OllamaEmbeddings } from '@langchain/ollama'

import { PostgresConnection } from './infrastructure/PostgresConnection'

import catalogueJson from '../data/catalogue.json'

async function main (
  pgConnection: PostgresConnection,
  embeddingsGenerator: OllamaEmbeddings
): Promise<void> {
  await pgConnection.sql`CREATE EXTENSION IF NOT EXISTS vector;`
  await pgConnection.sql`DROP SCHEMA IF EXISTS catalogue CASCADE;`
  await pgConnection.sql`CREATE SCHEMA catalogue;`
  await pgConnection.sql`CREATE TABLE catalogue.products (id VARCHAR(64) PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, embedding vector(768));
`

  await Promise.all(
    catalogueJson[0].catalogueItems.map(async (catalogueItem) => {
      // testing request: curl http://localhost:11434/api/embeddings -d '{"model": "nomic-embed-text","prompt": "The sky is blue because of Rayleigh scattering"}'
      const [embedding] = await embeddingsGenerator.embedDocuments([
        catalogueItem.description.en_GB ?? ''
      ])

      await pgConnection.sql`
INSERT INTO catalogue.products (id, name, embedding)
VALUES (${catalogueItem.sku}, ${catalogueItem.title.en_GB}, ${JSON.stringify(embedding)});
`
    })
  )
}

const pgConnection = new PostgresConnection(
  'localhost',
  5432,
  'codely',
  'c0d3ly7v',
  'postgres'
)

const embeddingsGenerator = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434'
})

main(pgConnection, embeddingsGenerator)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    void pgConnection.end()
    console.log('Done!')
    process.exit(0)
  })
