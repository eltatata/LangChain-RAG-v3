import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MongoClient } from 'mongodb';
import { envs } from '../config';

const client = new MongoClient(envs.MONGODB_ATLAS_URI);
const collection = client
  .db(envs.DATABASE_NAME)
  .collection(envs.COLLECTION_NAME || 'data');

export const vectorStore = new MongoDBAtlasVectorSearch(
  new OpenAIEmbeddings(),
  {
    collection,
    indexName: 'vector_index',
    textKey: 'text',
    embeddingKey: 'embedding',
  },
);
