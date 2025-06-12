import 'reflect-metadata'

import { OllamaEmbeddings } from '@langchain/ollama'

import { PostgresConnection } from './infrastructure/PostgresConnection'

import catalogueJson from '../data/catalogue.json'

async function main (
  pgConnection: PostgresConnection,
  embeddingsGenerator: OllamaEmbeddings
): Promise<void> {
  await Promise.all(
    catalogueJson[0].catalogueItems.map(async (catalogueItem) => {
      const [embedding] = await embeddingsGenerator.embedDocuments([
        catalogueItem.description.en_GB ?? ''
      ])

      await pgConnection.sql`
INSERT INTO mooc.courses (id, name, embedding)
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
