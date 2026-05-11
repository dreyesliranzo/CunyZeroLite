/**
 * Generates OpenAI embeddings for every policy entry in data/policy.json
 * and writes them back inline as the `embedding` field. Intended to be
 * re-run any time the policy text changes.
 *
 * Run: `npm run embed`
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const POLICY_PATH = resolve(process.cwd(), "data/policy.json");
const MODEL = "text-embedding-3-small";

type PolicyEntry = {
  topic: string;
  info: string;
  embedding?: number[];
};

type PolicyFile = {
  system_instructions: string;
  embedding_model?: string;
  embedding_dim?: number;
  policies: PolicyEntry[];
};

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set in environment.");
    process.exit(1);
  }

  const file: PolicyFile = JSON.parse(readFileSync(POLICY_PATH, "utf-8"));
  const openai = new OpenAI({ apiKey });

  // One batched call covers the whole corpus — the embeddings endpoint
  // accepts an array of inputs, so 16 entries is one round-trip.
  const inputs = file.policies.map((p) => `${p.topic}\n${p.info}`);
  console.log(`Embedding ${inputs.length} policy entries via ${MODEL}…`);

  const response = await openai.embeddings.create({
    model: MODEL,
    input: inputs,
  });

  if (response.data.length !== inputs.length) {
    throw new Error(
      `Expected ${inputs.length} embeddings, got ${response.data.length}.`,
    );
  }

  const dim = response.data[0].embedding.length;
  for (let i = 0; i < file.policies.length; i++) {
    file.policies[i].embedding = response.data[i].embedding;
  }
  file.embedding_model = MODEL;
  file.embedding_dim = dim;

  writeFileSync(POLICY_PATH, JSON.stringify(file, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${file.policies.length} embeddings (${dim} dim) to ${POLICY_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
