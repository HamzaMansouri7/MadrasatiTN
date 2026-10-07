import { ChainName } from '../ai/types';

export interface Skill<TInput = Record<string, unknown>> {
  id: string;
  version: string;
  chain: ChainName;
  schema?: object;
  temperature: number;
  build: (input: TInput) => string;
}
