import { PostgresConnection } from './infrastructure/PostgresConnection'
import { OllamaEmbeddingsGenerator } from './infrastructure/OllamaEmbeddingsGenerator'
import { ProductRepository } from './infrastructure/ProductRepository'

async function createDatabase (pgConnection: PostgresConnection): Promise<void> {
  await pgConnection.sql`CREATE EXTENSION IF NOT EXISTS vector;`
  await pgConnection.sql`DROP SCHEMA IF EXISTS catalogue CASCADE;`
  await pgConnection.sql`CREATE SCHEMA catalogue;`
  await pgConnection.sql`CREATE TABLE catalogue.products (sku VARCHAR(64) PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, description VARCHAR(1024) NOT NULL, embedding vector(768));`
}

async function main (
  pgConnection: PostgresConnection,
  productRepository: ProductRepository
): Promise<void> {
  await createDatabase(pgConnection)

  const products = await productRepository.getAll()

  await Promise.all(products.map(async (product) => {
    await productRepository.create(product)
  }))

  console.log('Done!')
}

const pgConnection = new PostgresConnection()
const embeddingsGenerator = new OllamaEmbeddingsGenerator()
const productRepository = new ProductRepository(pgConnection, embeddingsGenerator)

void main(pgConnection, productRepository)
  .catch(console.error)
  .finally(() => {
    void pgConnection.end()
  })
