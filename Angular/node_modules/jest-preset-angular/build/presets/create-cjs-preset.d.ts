import type { Config } from 'jest';
import type { TsJestTransformerOptions } from 'ts-jest';
import { basePresetConfig } from './utils';
type CjsPresetType = typeof basePresetConfig & Required<Pick<Config, 'transformIgnorePatterns' | 'transform'>>;
type CjsPresetOptionsType = Omit<TsJestTransformerOptions, 'useESM' | 'stringifyContentPathRegex' | 'compiler'>;
export declare const createCjsPreset: (options?: CjsPresetOptionsType) => CjsPresetType;
export {};
