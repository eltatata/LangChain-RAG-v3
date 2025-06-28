import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MongoClient } from 'mongodb';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { envs } from '../config';

const embeddings = new OpenAIEmbeddings();

(async () => {
  const client = new MongoClient(envs.MONGODB_ATLAS_URI || '');
  const collection = client
    .db(envs.DATABASE_NAME)
    .collection(envs.COLLECTION_NAME || 'data');

  const loader = new PDFLoader('./src/docs/estruc-datos.pdf');
  const doc = await loader.load();

  let text = '';
  doc.forEach((page) => {
    text += page.pageContent;
  });

  const splitter = new CharacterTextSplitter({
    separator: '\n',
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([text]);
  console.log(`Cantidad de documentos creados: ${docs.length}`);

  await MongoDBAtlasVectorSearch.fromDocuments(docs, embeddings, {
    collection,
    indexName: 'vector_index',
    textKey: 'text',
    embeddingKey: 'embedding',
  });

  await client.close();
})();
