import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // New: Destructure 'attachment' from the request body
    const { prompt, models, attachment } = await req.json();

    if (!prompt || !models || !Array.isArray(models) || models.length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt and models are required" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY environment variable is not set" }),
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start all model streams in parallel
          const streamPromises = models.map(async (model: string) => {
            try {
              // Prepare input: if attachment exists, use 'messages' format for multimodal
              const inputOptions = attachment
                ? {
                    messages: [
                      {
                        role: "user",
                        content: [
                          { type: "text", text: prompt },
                          { type: "image", image: attachment }, // Vercel SDK handles the data URL
                        ],
                      },
                    ],
                  }
                : { prompt }; // Fallback to simple prompt for text-only

              // @ts-ignore - Dynamic property usage
              const result = await streamText({
                model: openrouter(model),
                ...inputOptions,
              });

              return {
                model,
                textStream: result.textStream,
                error: null,
              };
            } catch (error) {
              return {
                model,
                textStream: null,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          });

          const streamResults = await Promise.all(streamPromises);
          const readers = new Map<string, ReadableStreamDefaultReader<string>>();
          const modelBuffers = new Map<string, string>();
          const completedModels = new Set<string>();

          // Initialize readers for successful streams
          streamResults.forEach((result) => {
            if (result.textStream && !result.error) {
              const reader = result.textStream.getReader();
              readers.set(result.model, reader);
              modelBuffers.set(result.model, "");
            } else if (result.error) {
              // Send error immediately
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    model: result.model,
                    error: result.error,
                  })}\n\n`
                )
              );
              completedModels.add(result.model);
            }
          });

          // Process all streams concurrently with timeout
          const processStream = async (model: string, reader: ReadableStreamDefaultReader<string>) => {
            const timeout = 60000; // 60 second timeout per model
            let lastActivity = Date.now();
            let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

            const checkTimeout = () => {
              if (Date.now() - lastActivity > timeout) {
                completedModels.add(model);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      model,
                      error: "Request timeout - model took too long to respond",
                    })}\n\n`
                  )
                );
                reader.cancel().catch(() => {});
                return true;
              }
              return false;
            };

            try {
              while (true) {
                // Check timeout before reading
                if (checkTimeout()) break;

                const readPromise = reader.read();
                const timeoutPromise = new Promise<{ done: boolean; value?: string }>((resolve) => {
                  timeoutHandle = setTimeout(() => {
                    if (checkTimeout()) {
                      resolve({ done: true });
                    }
                  }, timeout - (Date.now() - lastActivity));
                });

                const { done, value } = await Promise.race([readPromise, timeoutPromise]);
                
                if (timeoutHandle) {
                  clearTimeout(timeoutHandle);
                  timeoutHandle = null;
                }

                if (done) {
                  completedModels.add(model);
                  // Send final update for this model
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "update",
                        updates: { [model]: modelBuffers.get(model) || "" },
                      })}\n\n`
                    )
                  );
                  break;
                }

                if (value) {
                  lastActivity = Date.now();
                  const currentBuffer = modelBuffers.get(model) || "";
                  const newBuffer = currentBuffer + value;
                  modelBuffers.set(model, newBuffer);

                  // Send update for this model
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "update",
                        updates: { [model]: newBuffer },
                      })}\n\n`
                    )
                  );
                }
              }
            } catch (error) {
              if (timeoutHandle) clearTimeout(timeoutHandle);
              completedModels.add(model);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    model,
                    error: error instanceof Error ? error.message : "Stream error",
                  })}\n\n`
                )
              );
            } finally {
              reader.releaseLock();
            }
          };

          // Start processing all streams
          const processingPromises = Array.from(readers.entries()).map(([model, reader]) =>
            processStream(model, reader)
          );

          // Wait for all streams to complete
          await Promise.all(processingPromises);

          // Send completion message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                models: Array.from(modelBuffers.keys()),
              })}\n\n`
            )
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
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
    console.error("Error in compare route:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}