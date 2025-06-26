import { z } from 'zod'
import { ChatOllama } from '@langchain/ollama'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts'
import { PostgresConnection } from './infrastructure/PostgresConnection'
import { type Product, ProductRepository } from './infrastructure/ProductRepository'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

async function main (
  basketSkus: string[],
  productRepository: ProductRepository
): Promise<void> {
  const availableProducts = await productRepository.getAll()

  const basketProducts = availableProducts.filter(p => basketSkus.includes(p.sku))

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
    HumanMessagePromptTemplate.fromTemplate(
      `
You are an advanced product recommender. Your task is to suggest 3 products to a user based on a list of products that the user has added to their basket. Consider the following:
- You can only recommend products from the list of available products.
- You can only recommend products that the user has not yet added to their basket.
- You should provide a reason for each recommendation in neutral English. i.e. "Because you have selected a ham sandwich in your basket".
- You should return ONLY an array of objects, one for each recommended product. Each product should be an object with the properties "sku" (string), "name" (string) and "reason" (string).
- The resulting array of objects should be in JSON format, it should be parseable with the Javascript JSON.parse function. The JSON should have the following structure:
{formatInstructions}

List of available products (each one has an sku, name and description):
{availableProducts}

List of products in the user's basket (each one has an sku, name and description):
{basketProducts}
      `.trim()
    )
  ])

  const chain = RunnableSequence.from([
    chatPrompt,
    new ChatOllama({
      model: 'llama3.1:8b',
      temperature: 0
    }),
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
  return `sku: ${product.sku}, name: ${product.name}, description: ${product.description}`
}

function formatInputBasketSkus (arg: string): string[] {
  return arg.split(',')
}

const pgConnection = new PostgresConnection()
const productRepository = new ProductRepository(pgConnection, null as any)

main(formatInputBasketSkus(process.argv[2]), productRepository)
  .catch(console.error)
  .finally(() => {
    void pgConnection.end()
    console.log('Done!')

    process.exit(0)
  })
