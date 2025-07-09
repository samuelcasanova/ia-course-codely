import { OllamaEmbeddings } from '@langchain/ollama'
import { config } from '../config/config'

export class OllamaEmbeddingsGenerator {
  private readonly generator: OllamaEmbeddings
  constructor () {
    this.generator = new OllamaEmbeddings(config.ia)
  }

  async getEmbedding (text: string): Promise<number[]> {
    // testing request: curl http://localhost:11434/api/embeddings -d '{"model": "nomic-embed-text","prompt": "The sky is blue because of Rayleigh scattering"}'
    return await this.generator.embedQuery(text)
  }
}
