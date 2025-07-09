import { OllamaEmbeddings } from '@langchain/ollama'
import { PostgresConnection } from './infrastructure/PostgresConnection'

async function main (
  query: string,
  connection: PostgresConnection,
  embeddingsGenerator: OllamaEmbeddings
): Promise<void> {
  const embeddings = JSON.stringify(
    await embeddingsGenerator.embedQuery(query)
  )

  const results = await connection.sql`
SELECT name
FROM catalogue.products
ORDER BY (embedding <=> ${embeddings})
LIMIT 5;
`

  console.log(`For the query "${query}" the results are:`, results.map(r => r.name))
}

const pgConnection = new PostgresConnection()
const embeddingsGenerator = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434'
})

main(process.argv[2], pgConnection, embeddingsGenerator)
  .catch(console.error)
  .finally(() => {
    void pgConnection.end()
    console.log('Done!')

    process.exit(0)
  })
