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
    // We now expect a JSON string of the entire conversation history
    const messagesJson = formData.get("messages") as string;
    const model = formData.get("model") as string;

    if (!messagesJson || !model) {
      return new Response("Missing messages or model", { status: 400 });
    }

    const messages = JSON.parse(messagesJson);

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