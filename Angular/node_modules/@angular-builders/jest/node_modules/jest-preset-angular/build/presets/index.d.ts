import type { TsJestTransformerOptions } from 'ts-jest';
declare const defaultTransformerOptions: TsJestTransformerOptions;
declare const defaultPreset: {
    transformIgnorePatterns: string[];
    transform: {
        '^.+\\.(ts|js|mjs|html|svg)$': (string | import("ts-jest").TsJestGlobalOptions)[];
    };
    snapshotSerializers?: string[] | undefined;
    moduleFileExtensions?: string[] | undefined;
    testEnvironment?: string | undefined;
};
declare const defaultEsmPreset: {
    extensionsToTreatAsEsm: string[];
    moduleNameMapper: {
        tslib: string;
    };
    transform: {
        '^.+\\.(ts|js|html|svg)$': (string | {
            useESM: boolean;
            tsconfig?: boolean | string | import("ts-jest").RawCompilerOptions | import("ts-jest").TsConfigCompilerOptionsJson;
            isolatedModules?: boolean;
            compiler?: "typescript" | "ttypescript" | string;
            astTransformers?: import("ts-jest").ConfigCustomTransformer;
            diagnostics?: boolean | {
                pretty?: boolean;
                ignoreCodes?: number | string | Array<number | string>;
                exclude?: string[];
                warnOnly?: boolean;
            };
            babelConfig?: boolean | string | import("ts-jest").BabelConfig;
            stringifyContentPathRegex?: string | RegExp;
        })[];
    };
    transformIgnorePatterns: string[];
    snapshotSerializers?: string[] | undefined;
    moduleFileExtensions?: string[] | undefined;
    testEnvironment?: string | undefined;
};
export { defaultPreset, defaultEsmPreset, defaultTransformerOptions };
export { createCjsPreset } from './create-cjs-preset';
export { createEsmPreset } from './create-esm-preset';
