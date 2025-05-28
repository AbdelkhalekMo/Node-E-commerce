import type { Logger } from 'bs-logger';
import { globsToMatcher } from 'jest-util';
import { type RawCompilerOptions, ConfigSet, type TsJestTransformOptions } from 'ts-jest';
import type { ParsedCommandLine } from 'typescript';
export declare class NgJestConfig extends ConfigSet {
    readonly processWithEsbuild: ReturnType<typeof globsToMatcher>;
    constructor(jestConfig: TsJestTransformOptions['config'] | undefined, parentLogger?: Logger | undefined);
    protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): ParsedCommandLine;
}
