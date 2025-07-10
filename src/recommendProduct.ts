import { z } from 'zod'
import { ChatOllama } from '@langchain/ollama'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts'
import { PostgresConnection } from './infrastructure/PostgresConnection'
import { type Product, ProductRepository } from './infrastructure/ProductRepository'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { OllamaEmbeddingsGenerator } from './infrastructure/OllamaEmbeddingsGenerator'

async function main (
  model: string,
  basketSkus: string[],
  isFiltered: boolean,
  productRepository: ProductRepository
): Promise<void> {
  const availableProducts = isFiltered ? await productRepository.getSimilarBySkus(basketSkus, 10) : await productRepository.getAll()

  const basketProducts = await productRepository.getBySkus(basketSkus)

  const outputParser = StructuredOutputParser.fromZodSchema(
    z.array(
      z.object({
        sku: z.string().describe('product identifier'),
        name: z
          .string()
          .describe('product name'),
        reason: z
          .string()
          .describe('brief description of the product')
      })
    )
  )

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate('You are an advanced product recommender'),
    HumanMessagePromptTemplate.fromTemplate(
      `
List of available products (each one has an sku, name and description):
{availableProducts}

List of products the customer has in their basket (each one has an sku, name and description):
{basketProducts}

Your task is to recommend 3 available products to a customer, based on the list of products the customer has in their basket. Consider the following:
- You can only recommend products from the list of available products.
- You can only recommend products that are not currently in their basket.
- You should provide a reason for each recommendation in neutral English.
- You should return ONLY an array of objects, one for each recommended product, in JSON format (don't add any other text or symbols, just parseable JSON), with the following structure:
{formatInstructions}
      `.trim()
    )
  ])

  const chain = RunnableSequence.from([
    chatPrompt, model === 'gemini'
      ? new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash-lite', apiKey: process.env.GOOGLE_GENAI_API_KEY as string, temperature: 0 })
      : new ChatOllama({ model: 'llama3.2:3b', temperature: 0 }),
    outputParser
  ])

  const suggestions = await chain.invoke({
    availableProducts: availableProducts.map(formatProduct).join('\n'),
    basketProducts: basketProducts.map(formatProduct).join('\n'),
    formatInstructions: outputParser.getFormatInstructions()
  })

  console.log('\nYou had these products in your basket:', basketProducts.map(p => `${p.sku}: ${p.name}`))
  console.log('\nBased on your basket we have these recommended products for you:', suggestions.map(p => `${p.name}, ${p.reason}`))
}

function formatProduct (product: Product): string {
  return `- sku: ${product.sku}, name: ${product.name}, description: ${product.description}`
}

function formatInputBasketSkus (arg: string): string[] {
  return arg.split(',')
}

const model = process.argv[2]
const skus = formatInputBasketSkus(process.argv[3])
const isFiltered = process.argv[4] === 'true'

const pgConnection = new PostgresConnection()
const embeddingsGenerator = new OllamaEmbeddingsGenerator()
const productRepository = new ProductRepository(pgConnection, embeddingsGenerator)

main(model, skus, isFiltered, productRepository)
  .catch(console.error)
  .finally(() => {
    void pgConnection.end()
  })
