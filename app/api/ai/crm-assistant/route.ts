import { NextResponse } from "next/server";

type AssistantRequest = {
  context?: unknown;
  missingItems?: string[];
  mode?: string;
};

type OpenAIResponse = {
  output?: {
    content?: {
      text?: string;
      type?: string;
    }[];
    type?: string;
  }[];
  output_text?: string;
};

function isAssistantRequest(value: unknown): value is AssistantRequest {
  return typeof value === "object" && value !== null;
}

function extractText(payload: OpenAIResponse) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join("\n") || ""
  );
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Az AI funkció nincs konfigurálva." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Érvénytelen AI kérés." },
      { status: 400 },
    );
  }

  if (!isAssistantRequest(body)) {
    return NextResponse.json(
      { error: "Érvénytelen AI kérés." },
      { status: 400 },
    );
  }

  const prompt = `
Te egy magyar nyelvű, röviden és praktikusan fogalmazó CRM munkaszervező asszisztens vagy.
Feladatod: egy rendezvényes ládavasút cég munkájához adj összefoglalót és teendőlistát.
Ne írj hosszú magyarázatot. Legyen üzleti, konkrét, maximum 8-10 sor.

Mód: ${body.mode ?? "munka_osszefoglalo"}
Hiányzó adatok: ${(body.missingItems ?? []).join(", ") || "nincs ismert hiány"}
Kontextus JSON:
${JSON.stringify(body.context ?? {}, null, 2)}
`;

  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: prompt,
        max_output_tokens: 450,
        model: "gpt-5.2",
      }),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return NextResponse.json(
      { error: "Az AI asszisztens jelenleg nem elérhető." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Az AI asszisztens jelenleg nem elérhető." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractText(data);

  return NextResponse.json({
    text: text || "Nem érkezett értelmezhető AI válasz.",
  });
}
