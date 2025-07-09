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
    const embedding = await this.embeddingsGenerator.getEmbedding(product.description)

    await this.pgConnection.sql`
    INSERT INTO catalogue.products (sku, name, description, embedding)
    VALUES (${product.sku}, ${product.name}, ${product.description}, ${JSON.stringify(embedding)});
    `
  }

  async getBySkus (skus: string[]): Promise<Product[]> {
    const allProducts = await this.getAll()
    return allProducts.filter(p => skus.includes(p.sku))
  }

  async getSimilarBySkus (skus: string[], limit: number): Promise<Product[]> {
    const allProducts = await this.getAll()
    const products = allProducts.filter(p => skus.includes(p.sku))
    const embedding = JSON.stringify(
      await this.embeddingsGenerator.getEmbedding(products.map(p => p.description).join('\n'))
    )
    const results = await this.pgConnection.sql`
    SELECT sku, name, description
    FROM catalogue.products
    WHERE sku NOT IN (${skus.map(sku => `'${sku}'`).join(', ')})
    ORDER BY (embedding <=> ${embedding})
    LIMIT ${limit};
    `

    return results.map(r => ({
      sku: r.sku,
      name: r.name,
      description: r.description
    }))
  }
}
