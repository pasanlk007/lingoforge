// Shared usage/cost logging for every Claude API call made from a server
// route (pro-lesson generation, scenario conversation, etc). Writes one
// append-only log document per call to Firestore so real spend can be
// queried later, instead of only ever estimating it.
//
// This intentionally does NOT touch any pricing, paywall, or access-control
// logic — it only records what already happened, after the real API call
// already succeeded or failed.

import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from './scenarioFirestoreAdmin';

// Per-million-token pricing in USD. Update this if Anthropic's rates change,
// or if a route starts using a different model — everything else derives
// from this table automatically.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-6'];
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

type FirestoreFieldValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number };

export async function logAiUsage(params: {
  feature: 'pro_lesson' | 'scenario_conversation' | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  targetLanguage?: string;
  nativeLanguage?: string;
  userId?: string;
  extra?: Record<string, string | number>;
}): Promise<void> {
  try {
    const { feature, model, inputTokens, outputTokens, targetLanguage, nativeLanguage, userId, extra } = params;
    const costUsd = estimateCostUsd(model, inputTokens, outputTokens);
    const now = new Date();

    const fields: Record<string, FirestoreFieldValue> = {
      feature: { stringValue: feature },
      model: { stringValue: model },
      inputTokens: { integerValue: String(inputTokens) },
      outputTokens: { integerValue: String(outputTokens) },
      costUsd: { doubleValue: costUsd },
      createdAt: { stringValue: now.toISOString() },
      // YYYY-MM-DD — lets you filter/sum a single day's docs without
      // parsing timestamps client-side.
      dateKey: { stringValue: now.toISOString().slice(0, 10) },
    };
    if (targetLanguage) fields.targetLanguage = { stringValue: targetLanguage };
    if (nativeLanguage) fields.nativeLanguage = { stringValue: nativeLanguage };
    if (userId) fields.userId = { stringValue: userId };
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        fields[key] = typeof value === 'number' ? { doubleValue: value } : { stringValue: String(value) };
      }
    }

    const token = await getScenarioFirebaseToken();
    await fetch(`${scenarioFirestoreBaseUrl()}/aiUsageLogs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (e) {
    // Usage logging must never break the actual feature it's measuring.
    console.error('logAiUsage failed:', e);
  }
}
