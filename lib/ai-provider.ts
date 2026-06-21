import { PromptPayload } from "./ai-prompts";

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "anthropic" | "openrouter";
  apiKey: string;
  model: string;
}

export function getProviderConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER || "gemini") as "gemini" | "openai" | "anthropic" | "openrouter";
  
  let apiKey = "";
  let model = "";

  if (provider === "gemini") {
    apiKey = process.env.GEMINI_API_KEY || "";
    model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  } else if (provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY || "";
    model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  } else if (provider === "anthropic") {
    apiKey = process.env.ANTHROPIC_API_KEY || "";
    model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
  } else if (provider === "openrouter") {
    apiKey = process.env.OPENROUTER_API_KEY || "";
    model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  }

  return { provider, apiKey, model };
}

export async function getAIStream(
  payload: PromptPayload,
  config: AIProviderConfig,
  onComplete?: (fullText: string) => void
): Promise<ReadableStream<Uint8Array>> {
  const { provider, apiKey, model } = config;
  const temp = 0.3;

  if (!apiKey) {
    throw new Error(`API key for provider "${provider}" is not configured. Please add it to your environment variables.`);
  }

  let url = "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: any = {};

  if (provider === "gemini") {
    const isOAuth = apiKey.startsWith("ya29.") || apiKey.startsWith("AQ.");
    if (isOAuth) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    }
    body = {
      contents: [
        {
          role: "user",
          parts: [{ text: payload.user }]
        }
      ],
      systemInstruction: {
        parts: [{ text: payload.system }]
      },
      generationConfig: {
        temperature: temp
      }
    };
  } else if (provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = {
      model,
      messages: [
        { role: "system", content: payload.system },
        { role: "user", content: payload.user }
      ],
      stream: true,
      temperature: temp
    };
  } else if (provider === "openrouter") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = "https://resumeai.pro";
    headers["X-Title"] = "ResumeAI Pro";
    body = {
      model,
      messages: [
        { role: "system", content: payload.system },
        { role: "user", content: payload.user }
      ],
      stream: true,
      temperature: temp
    };
  } else if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model,
      messages: [
        { role: "user", content: payload.user }
      ],
      system: payload.system,
      stream: true,
      max_tokens: 4000,
      temperature: temp
    };
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`LLM Provider API Error (${provider}):`, errText);
    throw new Error(`AI generation failed with status ${res.status}: ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get readable stream from AI provider response.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const processLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith("data:")) return;
    const dataStr = line.slice(5).trim();
    if (dataStr === "[DONE]") return;

    try {
      const parsed = JSON.parse(dataStr);
      let text = "";

      if (provider === "gemini") {
        text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (provider === "openai" || provider === "openrouter") {
        text = parsed.choices?.[0]?.delta?.content || "";
      } else if (provider === "anthropic") {
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          text = parsed.delta.text;
        }
      }

      if (text) {
        fullText += text;
        controller.enqueue(encoder.encode(text));
      }
    } catch (e) {
      // Ignore JSON parsing errors for partial or status lines
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim(), controller);
            }
            if (onComplete) {
              onComplete(fullText);
            }
            controller.close();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            processLine(trimmed, controller);
          }
        }
      } catch (err: any) {
        console.error("Stream reading error:", err);
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel().catch((err) => console.error("Error cancelling upstream reader:", err));
    }
  });
}
