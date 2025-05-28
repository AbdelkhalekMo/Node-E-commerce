import { type TsJestAstTransformer, TsCompiler, type ConfigSet } from 'ts-jest';
import ts from 'typescript';
export declare class NgJestCompiler extends TsCompiler {
    readonly configSet: ConfigSet;
    readonly jestCacheFS: Map<string, string>;
    constructor(configSet: ConfigSet, jestCacheFS: Map<string, string>);
    protected _transpileOutput(fileContent: string, filePath: string): ts.TranspileOutput;
    protected _makeTransformers(customTransformers: TsJestAstTransformer): ts.CustomTransformers;
}
