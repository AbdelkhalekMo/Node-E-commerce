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
exports.CustomConfigResolver = void 0;
const fs_1 = require("fs");
const core_1 = require("@angular-devkit/core");
const common_1 = require("@angular-builders/common");
const utils_1 = require("./utils");
class CustomConfigResolver {
    constructor(options, logger) {
        this.options = options;
        this.logger = logger;
        // https://jestjs.io/docs/configuration
        this.allowedExtensions = ['js', 'ts', 'mjs', 'cjs', 'json'];
    }
    resolveGlobal(workspaceRoot) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageJsonPath = (0, core_1.getSystemPath)((0, core_1.join)(workspaceRoot, 'package.json'));
            const packageJson = require(packageJsonPath);
            if (packageJson.jest) {
                return packageJson.jest;
            }
            const tsConfig = (0, utils_1.getTsConfigPath)(workspaceRoot, this.options);
            const workspaceJestConfigPaths = this.allowedExtensions.map(extension => (0, core_1.getSystemPath)((0, core_1.join)(workspaceRoot, `jest.config.${extension}`)));
            const workspaceJestConfigPath = workspaceJestConfigPaths.find(path => (0, fs_1.existsSync)(path));
            if (!workspaceJestConfigPath) {
                return {};
            }
            return yield (0, common_1.loadModule)(workspaceJestConfigPath, tsConfig, this.logger);
        });
    }
    resolveForProject(projectRoot, configPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const jestConfigPath = (0, core_1.getSystemPath)((0, core_1.join)(projectRoot, configPath));
            if (!(0, fs_1.existsSync)(jestConfigPath)) {
                this.logger.warn(`warning: unable to locate custom jest configuration file at path "${jestConfigPath}"`);
                return {};
            }
            const tsConfig = (0, utils_1.getTsConfigPath)(projectRoot, this.options);
            return yield (0, common_1.loadModule)(jestConfigPath, tsConfig, this.logger);
        });
    }
}
exports.CustomConfigResolver = CustomConfigResolver;
//# sourceMappingURL=custom-config.resolver.js.map