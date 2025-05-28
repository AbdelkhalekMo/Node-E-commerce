"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgJestCompiler = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const ts_jest_1 = require("ts-jest");
const typescript_1 = __importDefault(require("typescript"));
const jit_transform_1 = require("../transformers/jit_transform");
const replace_resources_1 = require("../transformers/replace-resources");
class NgJestCompiler extends ts_jest_1.TsCompiler {
    constructor(configSet, jestCacheFS) {
        super(configSet, jestCacheFS);
        this.configSet = configSet;
        this.jestCacheFS = jestCacheFS;
        this._logger.debug('created NgJestCompiler');
    }
    _transpileOutput(fileContent, filePath) {
        var _a;
        const diagnostics = [];
        const compilerOptions = Object.assign({}, this._compilerOptions);
        const options = compilerOptions
            ?
                typescript_1.default.fixupCompilerOptions(compilerOptions, diagnostics)
            : {};
        const defaultOptions = typescript_1.default.getDefaultCompilerOptions();
        for (const key in defaultOptions) {
            if (Object.prototype.hasOwnProperty.call(defaultOptions, key) && options[key] === undefined) {
                options[key] = defaultOptions[key];
            }
        }
        for (const option of typescript_1.default.transpileOptionValueCompilerOptions) {
            options[option.name] = option.transpileOptionValue;
        }
        if (options.isolatedModules && options.emitDecoratorMetadata) {
            this._logger.warn(`
                TypeScript compiler option 'isolatedModules' may prevent the 'emitDecoratorMetadata' option from emitting all metadata.
                The 'emitDecoratorMetadata' option is not required by Angular and can be removed if not explicitly required by the project.'
            `);
        }
        options.suppressOutputPathCheck = true;
        options.allowNonTsExtensions = true;
        const sourceFile = typescript_1.default.createSourceFile(filePath, fileContent, (_a = options.target) !== null && _a !== void 0 ? _a : typescript_1.default.ScriptTarget.Latest);
        let outputText;
        let sourceMapText;
        const compilerHost = {
            getSourceFile: (fileName) => {
                return node_path_1.default.normalize(fileName) === node_path_1.default.normalize(filePath) ? sourceFile : undefined;
            },
            writeFile: (name, text) => {
                if (node_path_1.default.extname(name) === '.map') {
                    sourceMapText = text;
                }
                else {
                    outputText = text;
                }
            },
            getDefaultLibFileName: () => 'lib.d.ts',
            useCaseSensitiveFileNames: () => false,
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => '',
            getNewLine: () => node_os_1.default.EOL,
            fileExists: (fileName) => {
                return node_path_1.default.normalize(fileName) === node_path_1.default.normalize(filePath);
            },
            readFile: () => '',
            directoryExists: () => true,
            getDirectories: () => [],
        };
        this.program = typescript_1.default.createProgram([filePath], options, compilerHost);
        this.program.emit(undefined, undefined, undefined, undefined, this._makeTransformers(this.configSet.resolvedTransformers));
        return { outputText: outputText !== null && outputText !== void 0 ? outputText : '', diagnostics, sourceMapText };
    }
    _makeTransformers(customTransformers) {
        var _a;
        const program = this.program;
        const transformerFactories = super._makeTransformers(customTransformers);
        return Object.assign(Object.assign(Object.assign({}, transformerFactories.after), transformerFactories.afterDeclarations), { before: [
                ...((_a = transformerFactories.before) !== null && _a !== void 0 ? _a : []),
                (0, replace_resources_1.replaceResources)(program),
                (0, jit_transform_1.angularJitApplicationTransform)(program),
            ] });
    }
}
exports.NgJestCompiler = NgJestCompiler;
