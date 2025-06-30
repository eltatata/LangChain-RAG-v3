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
  BaseMessage,
  isAIMessage,
} from '@langchain/core/messages';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { vectorStore } from './src/database/database.connection';

// Setup memory management
const checkpointer = new MemorySaver();
const threadConfig = {
  configurable: { thread_id: 'abc123' },
  streamMode: 'values' as const,
};

// Model configuration
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
});

// Turn retrieval into a tool
const retrieveSchema = z.object({ query: z.string() });
const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`,
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

// Step 1: Generate an AIMessage that may include a tool-call to be sent.
async function queryOrRespond(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools([retrieve]);
  const response = await llmWithTools.invoke(state.messages);

  // MessagesState appends messages to state instead of overwriting
  return { messages: [response] };
}

// Step 2: Execute the retrieval.
const tools = new ToolNode([retrieve]);

// Step 3: Generate a response using the retrieved content.
async function generate(state: typeof MessagesAnnotation.State) {
  // Get generated ToolMessages
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

  // Format into prompt
  const docsContent = toolMessages.map((doc) => doc.content).join('\n');
  const systemMessageContent =
    'You are an assistant for question-answering tasks. ' +
    'Use the following pieces of retrieved context to answer ' +
    "the question. If you don't know the answer, say that you " +
    "don't know. Use three sentences maximum and keep the " +
    'answer concise.' +
    '\n\n' +
    `${docsContent}`;

  const conversationMessages = state.messages.filter(
    (message) =>
      message instanceof HumanMessage ||
      message instanceof SystemMessage ||
      (message instanceof AIMessage && (message.tool_calls?.length ?? 0) === 0),
  );
  const prompt = [
    new SystemMessage(systemMessageContent),
    ...conversationMessages,
  ];

  // Run
  const response = await llm.invoke(prompt);
  return { messages: [response] };
}

// Define the state graph
// The graph is a sequence of steps that can be executed in order
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

// Compile the graph with memory management
const graphWithMemory = graphBuilder.compile({ checkpointer });

const prettyPrint = (message: BaseMessage) => {
  let txt = `[${message._getType()}]: ${message.content}`;
  if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
    const tool_calls = (message as AIMessage)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join('\n');
    txt += ` \nTools: \n${tool_calls}`;
  }
  console.log(txt);
};

// Example usage
const inputs1 = {
  messages: [{ role: 'user', content: 'Hello, name is David' }],
};
for await (const step of await graphWithMemory.stream(inputs1, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs2 = {
  messages: [{ role: 'user', content: 'What is HASH' }],
};
for await (const step of await graphWithMemory.stream(inputs2, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs3 = {
  messages: [{ role: 'user', content: 'What is a stack' }],
};
for await (const step of await graphWithMemory.stream(inputs3, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs4 = {
  messages: [
    {
      role: 'user',
      content: 'What are the use cases, what is most commonly applied',
    },
  ],
};
for await (const step of await graphWithMemory.stream(inputs4, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs5 = {
  messages: [
    {
      role: 'user',
      content: 'What is Big O?',
    },
  ],
};
for await (const step of await graphWithMemory.stream(inputs5, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs6 = {
  messages: [
    {
      role: 'user',
      content:
        'According to the document, which are the slowest, in what I mentioned before',
    },
  ],
};
for await (const step of await graphWithMemory.stream(inputs6, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs7 = {
  messages: [
    {
      role: 'user',
      content:
        'What is my name? Can you tell me more about me based on our conversation?',
    },
  ],
};
for await (const step of await graphWithMemory.stream(inputs7, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}

const inputs8 = {
  messages: [
    {
      role: 'user',
      content:
        'Tell me what is a binary tree, and what is a binary search tree',
    },
  ],
};
for await (const step of await graphWithMemory.stream(inputs8, threadConfig)) {
  const lastMessage = step.messages[step.messages.length - 1];
  if (lastMessage) {
    prettyPrint(lastMessage);
  }
  console.log('-----\n');
}
