import { ChatOpenAI } from '@langchain/openai';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';
import { vectorStore } from '../database/database.connection';
import { promptTemplate } from '../utils/prompt-teplate';

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

export class RagService {
  private llm: ChatOpenAI;
  private graph: ReturnType<typeof this.createGraph>;

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    });

    this.graph = this.createGraph();
  }

  async RagResponse(message: string): Promise<string> {
    try {
      const inputs = {
        question: message,
      };

      const result = await this.graph.invoke(inputs);
      return result.answer;
    } catch (error) {
      console.error('Error in RAG response:', error);
      throw new Error('Failed to generate RAG response');
    }
  }

  private createGraph() {
    const retrieve = async (state: { question: string }) => {
      const retrievedDocs = await vectorStore.similaritySearch(state.question);
      return { context: retrievedDocs };
    };

    const generate = async (state: typeof StateAnnotation.State) => {
      const docsContent = state.context
        .map((doc) => doc.pageContent)
        .join('\n');
      const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
      });
      const response = await this.llm.invoke(messages);
      return { answer: response.content };
    };

    return new StateGraph(StateAnnotation)
      .addNode('retrieve', retrieve)
      .addNode('generate', generate)
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge('generate', '__end__')
      .compile();
  }
}
