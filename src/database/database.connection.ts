import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI || '');
const collection = client
  .db(process.env.DATABASE_NAME)
  .collection(process.env.COLLECTION_NAME || 'data');

const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
  collection,
  indexName: 'vector_index',
  textKey: 'text',
  embeddingKey: 'embedding',
});

export default vectorStore;
