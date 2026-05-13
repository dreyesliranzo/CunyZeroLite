import OpenAI from "openai";
import policyData from "../../data/policy.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
// Cosine similarity above this counts as a "real" match. Below this, we
// fall through to LLM general knowledge and warn the user about
// possible hallucinations (per spec: "with a warning for possible
// hallucinations").
const SIMILARITY_THRESHOLD = 0.4;
const TOP_K = 4;

interface PolicyEntry {
  topic: string;
  info: string;
  embedding?: number[];
}

interface PolicyFile {
  system_instructions: string;
  embedding_model?: string;
  embedding_dim?: number;
  policies: PolicyEntry[];
}

const policies = policyData as PolicyFile;

// Pre-compute vector norms once at module load so each cosine comparison
// is just a dot product + one division. Saves ~50% of the math per query
// vs computing norms inline every time.
type IndexedPolicy = {
  policy: PolicyEntry;
  vector: number[];
  norm: number;
};

const indexedPolicies: IndexedPolicy[] = policies.policies
  .filter((p): p is PolicyEntry & { embedding: number[] } => Array.isArray(p.embedding))
  .map((p) => ({
    policy: p,
    vector: p.embedding,
    norm: Math.sqrt(p.embedding.reduce((s, v) => s + v * v, 0)),
  }));

const HAS_EMBEDDINGS = indexedPolicies.length > 0;

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function cosine(a: number[], aNorm: number, b: number[], bNorm: number): number {
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot(a, b) / (aNorm * bNorm);
}

async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return res.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("Embedding query failed:", err);
    return null;
  }
}

// Fallback used when embeddings haven't been generated yet (build script
// not run) or when the embedding API call fails. Same heuristic as the
// pre-vector implementation.
function keywordSearch(query: string): PolicyEntry[] {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return [];
  const scored = policies.policies.map((p) => {
    const topic = p.topic.toLowerCase();
    const info = p.info.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (topic.includes(w)) score += 3;
      if (info.includes(w)) score += 1;
    }
    return { policy: p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map((s) => s.policy);
}

type SearchResult = {
  matches: PolicyEntry[];
  topScore: number; // 0 when nothing matched
  source: "vector" | "keyword";
};

async function searchPolicies(query: string): Promise<SearchResult> {
  if (HAS_EMBEDDINGS) {
    const queryVec = await embedQuery(query);
    if (queryVec) {
      const queryNorm = Math.sqrt(queryVec.reduce((s, v) => s + v * v, 0));
      const scored = indexedPolicies.map((entry) => ({
        policy: entry.policy,
        score: cosine(queryVec, queryNorm, entry.vector, entry.norm),
      }));
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, TOP_K);
      return {
        matches: top.filter((s) => s.score >= SIMILARITY_THRESHOLD).map((s) => s.policy),
        topScore: top[0]?.score ?? 0,
        source: "vector",
      };
    }
  }

  // Keyword fallback. Treat any keyword hit as below-threshold so the
  // hallucination warning still fires honestly.
  const matches = keywordSearch(query);
  return {
    matches,
    topScore: matches.length > 0 ? 0 : 0,
    source: "keyword",
  };
}

export async function getAIResponse(
  message: string,
  chatType: "home" | "portal",
  userContext?: string,
): Promise<string> {
  const result = await searchPolicies(message);
  const isLowConfidence =
    result.matches.length === 0 ||
    (result.source === "vector" && result.topScore < SIMILARITY_THRESHOLD);

  const contextBlock =
    result.matches.length > 0
      ? result.matches.map((p) => `**${p.topic}:** ${p.info}`).join("\n\n")
      : "No specific policy matched. Use your general knowledge about college systems to help.";

  const audiencePrompt =
    chatType === "home"
      ? "You are on the public home page. Help visitors and prospective students with general questions about the college, admissions, policies, and how to get started."
      : "You are inside the student portal helping a logged-in user. Use the user-specific data block below to answer questions about THEIR academic situation, courses, students, or queue. Refer to them by name when natural. Never invent data not present in the user data block.";

  const userBlock = userContext
    ? `\n\nUser-specific data (current snapshot):\n${userContext}`
    : "";

  const systemPrompt = `${policies.system_instructions}\n\n${audiencePrompt}\n\nRelevant college knowledge:\n${contextBlock}${userBlock}`;

  let reply: string;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    reply =
      response.choices[0]?.message?.content ??
      "Sorry, I couldn't generate a response. Please try again.";
  } catch (err) {
    console.error("Chat completion failed:", err);
    return "The AI service is temporarily unavailable. Please try again later.";
  }

  // Per spec UC-14: when the local information store has no answer, send
  // to the LLM but warn about possible hallucinations.
  if (isLowConfidence) {
    return `${reply}\n\n_⚠ This answer was generated without a strong match in the college knowledge base — verify with the registrar before relying on it._`;
  }
  return reply;
}
