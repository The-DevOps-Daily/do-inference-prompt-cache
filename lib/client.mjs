// One streamed chat completion against DigitalOcean Serverless Inference.
// Records time to the first streamed token (reasoning or answer), total time,
// and the usage block, including the cached-token fields.
import { inferenceKey, BASE_URL } from './env.mjs';

const KEY = inferenceKey();

export async function chat({ model, system, user, cacheKey, maxTokens = 48, timeoutMs = 120_000 }) {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0,
        stream: true,
        stream_options: { include_usage: true },
        ...(cacheKey ? { prompt_cache_key: cacheKey } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, status: res.status, error: body.slice(0, 300), totalMs: Math.round(performance.now() - t0) };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let ttftMs = null;
    let usage = null;
    let served = null;
    let text = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        const chunk = JSON.parse(data);
        served ??= chunk.model;
        const delta = chunk.choices?.[0]?.delta;
        if (delta && ttftMs === null && (delta.content || delta.reasoning_content)) {
          ttftMs = Math.round(performance.now() - t0);
        }
        if (delta?.content) text += delta.content;
        if (chunk.usage) usage = chunk.usage;
      }
    }
    return {
      ok: true,
      status: res.status,
      servedModel: served,
      ttftMs,
      totalMs: Math.round(performance.now() - t0),
      promptTokens: usage?.prompt_tokens ?? null,
      cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? usage?.cache_read_input_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens ?? null,
      answer: text.slice(0, 200),
    };
  } catch (err) {
    return { ok: false, status: 0, error: String(err).slice(0, 300), totalMs: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}
