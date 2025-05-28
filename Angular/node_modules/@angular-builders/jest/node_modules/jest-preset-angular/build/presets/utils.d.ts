import type { Config } from 'jest';
type BasePresetConfig = Required<Pick<Config, 'testEnvironment' | 'moduleFileExtensions' | 'snapshotSerializers'>>;
export declare const basePresetConfig: BasePresetConfig;
export {};
