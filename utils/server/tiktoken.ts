import cl100k from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

export const COMPLETION_TOKEN_LIMIT = 1000;
export const TOKENIZER_BUFFER_FACTOR = 0.9;

let initialized = false;

export const getTiktokenEncoding = async (): Promise<Tiktoken> => {
  if (!initialized) {
    await init((imports) => WebAssembly.instantiate(wasm, imports));
    initialized = true;
  }

  return new Tiktoken(cl100k.bpe_ranks, cl100k.special_tokens, cl100k.pat_str);
};