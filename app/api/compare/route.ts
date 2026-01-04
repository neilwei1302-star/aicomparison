import { OpenAI } from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://aicomparison.app", // Optional: your site URL
    "X-Title": "AI Comparison", // Optional: your site name
  },
});

export async function POST(req: Request) {
  try {
    // 1. Parse the new "FormData" format instead of JSON
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const model = formData.get("model") as string;
    
    // (Optional: We can extract the file here later if needed)
    // const file = formData.get("file"); 

    if (!prompt || !model) {
      return new Response("Missing prompt or model", { status: 400 });
    }

    // 2. Call the API with your powerful models
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      stream: true, // Keep streaming on
    });

    // 3. Stream the response back to the frontend
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            // Send data in a format the frontend expects
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