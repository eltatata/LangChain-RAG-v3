# Conversational RAG with LangChain v3

This project implements a Conversational RAG (Retrieval-Augmented Generation) using the new features introduced in LangChain v3, including an improved memory system, multi-thread conversation handling, and LangGraph for orchestration.

The service is built with Bun, TypeScript, Express (MVC), and MongoDB (Vector Store).

## 🚀 Main Technologies

- **Bun** – Modern and fast JavaScript runtime.
- **TypeScript** – Static typing for scalability and maintainability.
- **Express** – Web framework with an MVC architecture.
- **LangChain** – Framework for RAG, memory, and conversational flows.
- **LangGraph** – Conversation flow orchestration.
- **Enhanced Memory** – Support for multiple conversation threads.
- **MongoDB** (Vector Store) – Semantic search and embedding storage.
- **PDF Loader** – Context ingestion from PDF documents.

## 📌 Key Features

- ✅ Full Conversational RAG implementation.
- ✅ Context ingestion from PDF files.
- ✅ MongoDB Vector Store for embeddings.
- ✅ Conversation threads managed via client request headers.
- ✅ Middleware that validates and manages thread-related information.
- ✅ Decoupled logic in the services layer, including:
  - RAG configuration with LangChain.
  - LangGraph integration.
  - Prompt template definitions.
  - Conversation memory management.

## 📂 Project Structure
```
└── 📁src
    └── 📁config
        └── 📁envs
            ├── envs.ts
        └── 📁errors
            ├── customer-errors.ts
            ├── error-handler.ts
        ├── index.ts
    └── 📁controllers
        ├── index.ts
        ├── rag.controller.ts
    └── 📁database
        ├── database.connection.ts
    └── 📁docs
        ├── estruc-datos.pdf
    └── 📁interfaces
        └── 📁shared
            ├── shared.interfaces.ts
        ├── index.ts
    └── 📁middlewares
        ├── index.ts
        ├── session-validation.middleware.ts
    └── 📁routes
        ├── index.ts
        ├── rag.routes.ts
    └── 📁scripts
        ├── ingest-data.ts
    └── 📁server
        ├── index.ts
        ├── router.ts
        ├── server.ts
    └── 📁services
        ├── index.ts
        ├── rag.service.ts
    └── 📁utils
        ├── prompt-teplate.ts
    └── app.ts
```

## ⚡Workflow

1. Data Ingestion
    - The system loads a PDF, processes it, and generates embeddings stored in MongoDB.
2. Conversational Flow with RAG
    - The client sends messages through the API.
    - Headers include the conversation thread identifier.
    - Middleware validates the thread and passes it to the services layer.
3. Processing with LangChain + LangGraph
    - Executes RAG logic (retrieval + generation).
    - Keeps thread-specific memory to handle independent conversations.

## 🎥 Demo

## 🛠️ Installation & Usage
1. Clone repository
```
git clone https://github.com/eltatata/LangChain-RAG-v3.git
```
2. Install dependencies
```
bun install
```
3. Configure environment variables
```
cp .env.example .env
```
4. Run in development mode
```
bun dev
```

## 🔑 Environment Variables

The .env file must include values such as:

```
PORT=3000

DATABASE_NAME=langchain-v3-rag
COLLECTION_NAME=data
MONGODB_ATLAS_URI=your_mongodb_atlas_uri_here

OPENAI_API_KEY=your_openai_api_key_here
```

## 🤝 Contributing

Contributions are welcome!
Fork the repository, create a feature branch, and submit a PR 🚀.
