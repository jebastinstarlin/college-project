import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { createAgent, tool } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongoClient: MongoClient | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI || "");
    await mongoClient.connect();
  }
  return mongoClient;
};


// ✅ Simple in-memory document store — no API needed
let knowledgeChunks: string[] = [];

const loadKnowledgeBase = async (): Promise<void> => {
  if (knowledgeChunks.length > 0) return;

  const filePath = path.join(__dirname, "../../knowledge-base/edureach-knowledge.txt");
  const loader = new TextLoader(filePath);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);
  knowledgeChunks = allSplits.map((doc) => doc.pageContent);

  console.log(` Knowledge base loaded (${knowledgeChunks.length} chunks)`);
};


// ✅ Simple keyword search — no embedding API needed
const searchKnowledge = (query: string, topK: number = 3): string[] => {
  const queryWords = query.toLowerCase().split(/\s+/);

  const scored = knowledgeChunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      return acc + (chunkLower.includes(word) ? 1 : 0);
    }, 0);
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
};


export const initializeKnowledgeBase = async (): Promise<void> => {
  await loadKnowledgeBase();
  console.log(" Knowledge base ready!");
};


const createRetrieveTool = () => {
  return tool(
    async ({ query }: { query: string }) => {
      const results = searchKnowledge(query, 3);
      if (results.length === 0) return "No relevant information found.";
      return results.map((chunk) => `Content: ${chunk}`).join("\n\n");
    },
    {
      name: "retrieve",
      description:
        "Retrieve information from the EduReach College knowledge base. " +
        "Use this for any questions about courses, fees, admissions, mentors, campus, placements.",
      schema: z.object({ query: z.string() }),
    }
  );
};


export const getRAGResponse = async (question: string): Promise<string> => {
  try {
    console.log("Question received:", question);
    await loadKnowledgeBase();
    const retrieve = createRetrieveTool();

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const agent = createAgent({
      model,
      tools: [retrieve],
      systemPrompt:
        "You are EduReach Bot, a helpful AI counselor for EduReach College, Hyderabad. " +
        "ALWAYS use the retrieve tool to search the knowledge base before answering. " +
        "Be concise, friendly, and professional. " +
        "If the information is not found, say: " +
        "'I don't have that information right now. Click Talk to Us to speak with a counselor.'",
    });

    const result = await agent.invoke({
      messages: [{ role: "user", content: question }],
    });

    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) {
      return "I couldn't generate a response. Please try again.";
    }

    return typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  } catch (error: any) {
    console.error(" RAG Agent Error:", error);
    return `Error: ${error?.message || JSON.stringify(error)}`;
  }
};