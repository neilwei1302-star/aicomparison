import { OpenAI } from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://aicomparison.app",
    "X-Title": "AI Comparison",
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // We try to get 'messages' first (New Chat format)
    const messagesJson = formData.get("messages") as string;
    const model = formData.get("model") as string;

    if (!model) {
      return new Response("Missing model", { status: 400 });
    }

    let messages;
    if (messagesJson) {
      messages = JSON.parse(messagesJson);
    } else {
      // Fallback: If no history, just use the prompt
      const prompt = formData.get("prompt") as string;
      if (!prompt) return new Response("Missing prompt", { status: 400 });
      messages = [{ role: "user", content: prompt }];
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}