export class RagService {
  async RagResponse(message: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`RAG response for message: ${message}`);
      }, 1000);
    });
  }
}
