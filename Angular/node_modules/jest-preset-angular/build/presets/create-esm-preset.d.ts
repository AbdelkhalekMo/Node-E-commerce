import type { Config } from 'jest';
import type { TsJestTransformerOptions } from 'ts-jest';
import { basePresetConfig } from './utils';
type EsmPresetType = typeof basePresetConfig & Required<Pick<Config, 'extensionsToTreatAsEsm' | 'moduleNameMapper' | 'transformIgnorePatterns' | 'transform'>>;
type EsmPresetOptionsType = Omit<TsJestTransformerOptions, 'useESM' | 'stringifyContentPathRegex' | 'compiler'>;
export declare const createEsmPreset: (options?: EsmPresetOptionsType) => EsmPresetType;
export {};
