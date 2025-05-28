"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModule = loadModule;
const path = require("node:path");
const url = require("node:url");
const _tsNodeRegister = (() => {
    let lastTsConfig;
    return (tsConfig, logger) => {
        // Check if the function was previously called with the same tsconfig
        if (lastTsConfig && lastTsConfig !== tsConfig) {
            logger.warn(`Trying to register ts-node again with a different tsconfig - skipping the registration.
                   tsconfig 1: ${lastTsConfig}
                   tsconfig 2: ${tsConfig}`);
        }
        if (lastTsConfig) {
            return;
        }
        lastTsConfig = tsConfig;
        loadTsNode().register({
            project: tsConfig,
            compilerOptions: {
                module: 'CommonJS',
                types: [
                    'node', // NOTE: `node` is added because users scripts can also use pure node's packages as webpack or others
                ],
            },
        });
        const tsConfigPaths = loadTsConfigPaths();
        const result = tsConfigPaths.loadConfig(tsConfig);
        // The `loadConfig` returns a `ConfigLoaderResult` which must be guarded with
        // the `resultType` check.
        if (result.resultType === 'success') {
            const { absoluteBaseUrl: baseUrl, paths } = result;
            if (baseUrl && paths) {
                tsConfigPaths.register({ baseUrl, paths });
            }
        }
    };
})();
/**
 * check for TS node registration
 * @param file: file name or file directory are allowed
 * @todo tsNodeRegistration: require ts-node if file extension is TypeScript
 */
function tsNodeRegister(file = '', tsConfig, logger) {
    if (file === null || file === void 0 ? void 0 : file.endsWith('.ts')) {
        // Register TS compiler lazily
        _tsNodeRegister(tsConfig, logger);
    }
}
/**
 * This uses a dynamic import to load a module which may be ESM.
 * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
 * will currently, unconditionally downlevel dynamic import into a require call.
 * require calls cannot load ESM code and will result in a runtime error. To workaround
 * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
 * Once TypeScript provides support for keeping the dynamic import this workaround can
 * be dropped.
 *
 * @param modulePath The path of the module to load.
 * @returns A Promise that resolves to the dynamically imported module.
 */
function loadEsmModule(modulePath) {
    return new Function('modulePath', `return import(modulePath);`)(modulePath);
}
/**
 * Loads CJS and ESM modules based on extension
 */
function loadModule(modulePath, tsConfig, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        tsNodeRegister(modulePath, tsConfig, logger);
        switch (path.extname(modulePath)) {
            case '.mjs':
                // Load the ESM configuration file using the TypeScript dynamic import workaround.
                // Once TypeScript provides support for keeping the dynamic import this workaround can be
                // changed to a direct dynamic import.
                return (yield loadEsmModule(url.pathToFileURL(modulePath))).default;
            case '.cjs':
                return require(modulePath);
            case '.ts':
                try {
                    // If it's a TS file then there are 2 cases for exporing an object.
                    // The first one is `export blah`, transpiled into `module.exports = { blah} `.
                    // The second is `export default blah`, transpiled into `{ default: { ... } }`.
                    return require(modulePath).default || require(modulePath);
                }
                catch (e) {
                    if (e.code === 'ERR_REQUIRE_ESM') {
                        // Load the ESM configuration file using the TypeScript dynamic import workaround.
                        // Once TypeScript provides support for keeping the dynamic import this workaround can be
                        // changed to a direct dynamic import.
                        return (yield loadEsmModule(url.pathToFileURL(modulePath))).default;
                    }
                    throw e;
                }
            //.js
            default:
                // The file could be either CommonJS or ESM.
                // CommonJS is tried first then ESM if loading fails.
                try {
                    return require(modulePath);
                }
                catch (e) {
                    if (e.code === 'ERR_REQUIRE_ESM') {
                        // Load the ESM configuration file using the TypeScript dynamic import workaround.
                        // Once TypeScript provides support for keeping the dynamic import this workaround can be
                        // changed to a direct dynamic import.
                        return (yield loadEsmModule(url.pathToFileURL(modulePath))).default;
                    }
                    throw e;
                }
        }
    });
}
/**
 * Loads `ts-node` lazily. Moved to a separate function to declare
 * a return type, more readable than an inline variant.
 */
function loadTsNode() {
    return require('ts-node');
}
/**
 * Loads `tsconfig-paths` lazily. Moved to a separate function to declare
 * a return type, more readable than an inline variant.
 */
function loadTsConfigPaths() {
    return require('tsconfig-paths');
}
//# sourceMappingURL=load-module.js.map