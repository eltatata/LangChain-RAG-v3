import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
} from '@langchain/langgraph';
import { tool } from '@langchain/core/tools';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type MessageContent,
} from '@langchain/core/messages';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { vectorStore } from '../database/database.connection';
import type { DocumentInterface } from '@langchain/core/documents';

export class RagService {
  private llm: ChatOpenAI;
  private graph: ReturnType<typeof this.createGraph>;

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0.2,
    });
    this.graph = this.createGraph();
  }

  async RagResponse(
    message: string,
    sessionId: string,
  ): Promise<MessageContent> {
    try {
      const inputs = {
        messages: [{ role: 'user', content: message }],
      };
      const threadConfig = this.createThreadConfig(sessionId);

      const result = await this.graph.invoke(inputs, threadConfig);
      const lastMessageResult =
        result.messages[result.messages.length - 1] ||
        new AIMessage('No response');

      return lastMessageResult.content;
    } catch (error) {
      console.error('Error in RAG response:', error);
      throw new Error('Failed to generate RAG response');
    }
  }

  private createGraph() {
    const queryOrRespond = async (state: typeof MessagesAnnotation.State) => {
      const llmWithTools = this.llm.bindTools([this.retrieveTool()]);
      const response = await llmWithTools.invoke(state.messages);

      return { messages: [response] };
    };

    const tools = new ToolNode([this.retrieveTool()]);

    const generate = async (state: typeof MessagesAnnotation.State) => {
      const recentToolMessages = [];
      for (let i = state['messages'].length - 1; i >= 0; i--) {
        const message = state['messages'][i];
        if (message instanceof ToolMessage) {
          recentToolMessages.push(message);
        } else {
          break;
        }
      }
      const toolMessages = recentToolMessages.reverse();

      const docsContent = toolMessages.map((doc) => doc.content).join('\n');
      const systemMessageContent =
        'You are the official assistant of Voltix Electronics, a retail company specialized in consumer electronics. ' +
        'Your role is to answer only questions related to Voltix Electronics: company overview, catalog, products, suppliers, guarantees, policies, customer service, schedules, and contact information. ' +
        'Do not answer questions outside this scope. If the user asks something unrelated, politely decline and guide them back to company-related topics. ' +
        'If you do not know the answer from the provided context, say clearly that you don’t know and avoid making up information. ' +
        'when the user says hello or doesnt ask anything specific, respond with: "Hello, I am the virtual assistant of Voltix Electronics. How can I help you today?" ' +
        'Always answer in a friendly and informative tone. ' +
        '\n\n' +
        `${docsContent}`;

      const conversationMessages = state.messages.filter(
        (message) =>
          message instanceof HumanMessage ||
          message instanceof SystemMessage ||
          (message instanceof AIMessage &&
            (message.tool_calls?.length ?? 0) === 0),
      );
      const prompt = [
        new SystemMessage(systemMessageContent),
        ...conversationMessages,
      ];

      const response = await this.llm.invoke(prompt);
      return { messages: [response] };
    };

    const graphBuilder = new StateGraph(MessagesAnnotation)
      .addNode('queryOrRespond', queryOrRespond)
      .addNode('tools', tools)
      .addNode('generate', generate)
      .addEdge('__start__', 'queryOrRespond')
      .addConditionalEdges('queryOrRespond', toolsCondition, {
        __end__: '__end__',
        tools: 'tools',
      })
      .addEdge('tools', 'generate')
      .addEdge('generate', '__end__');

    const checkpointer = new MemorySaver();

    const graphWithMemory = graphBuilder.compile({
      checkpointer: checkpointer,
    });
    return graphWithMemory;
  }

  private retrieveTool() {
    const retrieveSchema = z.object({ query: z.string() });
    const retrieve = tool(
      async ({ query }) => {
        const retrievedDocs = await vectorStore.similaritySearch(query, 2);
        const serialized = retrievedDocs
          .map(
            (doc: DocumentInterface<Record<string, unknown>>) =>
              `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`,
          )
          .join('\n');
        return [serialized, retrievedDocs];
      },
      {
        name: 'retrieve',
        description: 'Retrieve information related to a query.',
        schema: retrieveSchema,
        responseFormat: 'content_and_artifact',
      },
    );
    return retrieve;
  }

  private createThreadConfig(sessionId: string) {
    return {
      configurable: { thread_id: sessionId },
      streamMode: 'values' as const,
    };
  }
}
