import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  DATABASE_NAME: get('DATABASE_NAME').required().asString(),
  COLLECTION_NAME: get('COLLECTION_NAME').required().asString(),
  MONGODB_ATLAS_URI: get('MONGODB_ATLAS_URI').required().asString(),
  OPENAI_API_KEY: get('OPENAI_API_KEY').required().asString(),
};
