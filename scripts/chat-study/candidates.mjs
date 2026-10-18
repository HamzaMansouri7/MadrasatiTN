const g = (m) => ({ id: `gemini/${m}`, provider: 'gemini', model: m });
const n = (m) => ({ id: `nvidia/${m}`, provider: 'nvidia', model: m });
const o = (m) => ({ id: `or/${m}`, provider: 'openrouter', model: m });
const q = (m) => ({ id: `groq/${m}`, provider: 'groq', model: m });
const c = (m) => ({ id: `cf/${m}`, provider: 'cloudflare', model: m });

export const CANDIDATES = [
  ...[
    'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3-flash-preview',
    'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite',
    'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it',
    'gemini-2.5-pro', 'gemini-3.1-pro-preview', 'gemini-pro-latest', 'gemini-4-argon',
  ].map(g),
  ...[
    'deepseek-ai/deepseek-v4.1-flash', 'moonshotai/kimi-k2.6', 'z-ai/glm-5.3', 'z-ai/glm-5.3-flash',
    'nvidia/nemotron-3-ultra-550b-a55b', 'nvidia/nemotron-3-super-120b-a12b', 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    'nvidia/nemotron-3.5-lightning-30b-a3b', 'nvidia/nemotron-nano-3-30b-a3b',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', 'google/gemma-4-31b-it', 'google/gemma-3-12b-it',
    'mistralai/mistral-large-2-instruct', 'mistralai/mistral-large', 'ai21labs/jamba-1.5-large-instruct',
    'openai/gpt-oss-20b', 'stepfun-ai/step-5-preview', 'poolside/laguna-xs-2.1', 'meta/muse-glimmer-30b',
    'nvidia/nemotron-4-340b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct', 'writer/palmyra-creative-122b',
    '01-ai/yi-large', 'microsoft/phi-3.5-moe-instruct', 'nv-mistralai/mistral-nemo-12b-instruct',
  ].map(n),
  ...[
    'nvidia/nemotron-3-ultra-550b-a55b:free', 'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 'nvidia/nemotron-3.5-lightning:free',
    'nvidia/nemotron-3.5-super-vl:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free',
    'thinkingmachines/inkling:free', 'thinkingmachines/inkling-small:free', 'poolside/laguna-s-2.1:free',
    'poolside/laguna-xs-2.1:free', 'xingchen-agi/xing4.0-29b-a4b:free', 'dots-studio/dots-3-note-preview:free',
    'openrouter/free',
  ].map(o),
  ...[
    '@cf/openai/gpt-oss-120b', '@cf/openai/gpt-oss-20b', '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    '@cf/zai-org/glm-5.3', '@cf/zai-org/glm-5.3-flash', '@cf/zai-org/glm-5.2', '@cf/zai-org/glm-4.7-flash',
    '@cf/moonshotai/kimi-k2.6', '@cf/deepseek-ai/deepseek-v4-flash-0731', '@cf/deepseek-ai/deepseek-v4-pro-0813',
    '@cf/qwen/qwen3.8-27b', '@cf/qwen/qwen3-30b-a3b-fp8', '@cf/mistralai/mistral-small-3.1-24b-instruct',
    '@cf/google/gemma-4-26b-a4b-it', '@cf/nvidia/nemotron-3-120b-a12b', '@cf/meta/llama-4-scout-17b-16e-instruct',
    '@cf/utter-project/eurollm-9b-it', '@cf/swiss-ai/apertus-v1.5-8b',
  ].map(c),
  ...['allam-2-7b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'].map(q),
];
