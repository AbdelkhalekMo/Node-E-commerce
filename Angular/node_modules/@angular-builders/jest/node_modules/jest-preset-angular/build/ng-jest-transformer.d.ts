import type { TransformedSource } from '@jest/transform';
import { type TsJestTransformerOptions, ConfigSet, TsJestTransformer, type TsJestTransformOptions } from 'ts-jest';
export declare class NgJestTransformer extends TsJestTransformer {
    #private;
    constructor(tsJestConfig?: TsJestTransformerOptions);
    protected _createConfigSet(config: TsJestTransformOptions['config'] | undefined): ConfigSet;
    protected _createCompiler(configSet: ConfigSet, cacheFS: Map<string, string>): void;
    private get version();
    process(fileContent: string, filePath: string, transformOptions: TsJestTransformOptions): TransformedSource;
    getCacheKey(fileContent: string, filePath: string, transformOptions: TsJestTransformOptions): string;
}
