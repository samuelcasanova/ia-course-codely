import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { writeFileSync } from 'fs'

async function main (): Promise<void> {
  console.log('Starting troubleshooting process')
  const directoryLoader = new DirectoryLoader('./data/ronda', {
    '.pdf': (path: string): PDFLoader =>
      new PDFLoader(path)
  })
  const documents = await directoryLoader.load()
  console.log(`${documents.length} documents loaded`)
  documents.forEach((document, index) => {
    delete document.metadata.pdf.metadata
    writeFileSync(`./data/ronda/${index}.txt`, `${document.pageContent}\n\nMetadada:\n${JSON.stringify(document.metadata, null, 2)}\n`)
  })
  console.log('Done!')
}

main()
  .catch((error) => {
    console.error(error)
  })
