import catalogueJson from '../../data/catalogue.json'
import type { OllamaEmbeddingsGenerator } from './OllamaEmbeddingsGenerator'
import type { PostgresConnection } from './PostgresConnection'

export interface Product {
  sku: string
  name: string
  description: string
}

export class ProductRepository {
  constructor (private readonly pgConnection: PostgresConnection, private readonly embeddingsGenerator: OllamaEmbeddingsGenerator) {}
  async getAll (): Promise<Product[]> {
    return catalogueJson[0].catalogueItems.map(item => ({
      sku: item.sku,
      name: item.title.en_GB,
      description: item.description.en_GB ?? ''
    }))
  }

  async create (product: Product): Promise<void> {
    const embedding = await this.embeddingsGenerator.getEmbeddings(product.description)

    await this.pgConnection.sql`
    INSERT INTO catalogue.products (id, name, embedding)
    VALUES (${product.sku}, ${product.name}, ${JSON.stringify(embedding)});
    `
  }
}
