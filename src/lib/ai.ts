import OpenAI from "openai";
import policyData from "../../data/policy.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PolicyEntry {
  topic: string;
  info: string;
}

function searchPolicies(query: string): PolicyEntry[] {
  const lower = query.toLowerCase();
  const scored = policyData.policies.map((p) => {
    const topicMatch = p.topic.toLowerCase();
    const infoMatch = p.info.toLowerCase();
    let score = 0;

    const words = lower.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      if (topicMatch.includes(word)) score += 3;
      if (infoMatch.includes(word)) score += 1;
    }

    return { policy: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.policy);
}

export async function getAIResponse(
  message: string,
  chatType: "home" | "portal"
): Promise<string> {
  const relevantPolicies = searchPolicies(message);

  const contextBlock =
    relevantPolicies.length > 0
      ? relevantPolicies.map((p) => `**${p.topic}:** ${p.info}`).join("\n\n")
      : "No specific policy matched. Use your general knowledge about college systems to help, but let the user know if you're unsure.";

  const systemPrompt =
    chatType === "home"
      ? `${policyData.system_instructions}\n\nYou are on the public home page. Help visitors and prospective students with general questions about the college, admissions, policies, and how to get started.\n\nRelevant college knowledge:\n${contextBlock}`
      : `${policyData.system_instructions}\n\nYou are inside the student portal. Help logged-in users understand academic policies, what grades mean, how registration works, how to navigate the system, and answer questions about their academic journey.\n\nRelevant college knowledge:\n${contextBlock}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return (
    response.choices[0]?.message?.content ??
    "Sorry, I couldn't generate a response. Please try again."
  );
}
