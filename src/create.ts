import { PostgresConnection } from './infrastructure/PostgresConnection'
import { OllamaEmbeddingsGenerator } from './infrastructure/OllamaEmbeddingsGenerator'
import { ProductsRepository } from './infrastructure/ProductsRepository'

async function createDatabase (pgConnection: PostgresConnection): Promise<void> {
  await pgConnection.sql`CREATE EXTENSION IF NOT EXISTS vector;`
  await pgConnection.sql`DROP SCHEMA IF EXISTS catalogue CASCADE;`
  await pgConnection.sql`CREATE SCHEMA catalogue;`
  await pgConnection.sql`CREATE TABLE catalogue.products (id VARCHAR(64) PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, embedding vector(768));`
}

async function main (): Promise<void> {
  const pgConnection = new PostgresConnection()

  try {
    const embeddingsGenerator = new OllamaEmbeddingsGenerator()
    const productRepository = new ProductsRepository(pgConnection, embeddingsGenerator)

    await createDatabase(pgConnection)

    const products = await productRepository.get()

    await Promise.all(products.map(async (product) => {
      await productRepository.create(product)
    }))
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await pgConnection.end()
    console.log('Done!')
    process.exit(0)
  }
}

void main()
