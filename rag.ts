import { Document } from '@langchain/core/documents';
import { ChatOpenAI } from '@langchain/openai';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { vectorStore } from './src/database/database.connection';
import { promptTemplate } from './src/utils/prompt-teplate';

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
});

type InputState = {
  question: string;
};

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

const retrieve = async (state: InputState) => {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
  const messages = await promptTemplate.invoke({
    question: state.question,
    context: docsContent,
  });
  const response = await llm.invoke(messages);
  return { answer: response.content };
};

// Compile application and test
const graph = new StateGraph(StateAnnotation)
  .addNode('retrieve', retrieve)
  .addNode('generate', generate)
  .addEdge('__start__', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', '__end__')
  .compile();

const inputs = {
  question: 'What is a stack?',
};

const result = await graph.invoke(inputs);
console.log(result.answer);
