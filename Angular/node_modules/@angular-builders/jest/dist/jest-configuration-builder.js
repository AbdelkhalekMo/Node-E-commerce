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
exports.JestConfigurationBuilder = void 0;
const core_1 = require("@angular-devkit/core");
const lodash_1 = require("lodash");
/**
 * A whitelist of property names that are meant to be concat.
 */
const ARRAY_PROPERTIES_TO_CONCAT = [
    // From Jest Config
    'setupFilesAfterEnv',
    // From ts-jest config
    'astTransformers',
];
/**
 * This function checks witch properties should be concat. Early return will
 * merge the data as lodash#merge would do it.
 */
function concatArrayProperties(objValue, srcValue, property) {
    if (!ARRAY_PROPERTIES_TO_CONCAT.includes(property)) {
        return;
    }
    if (!(0, lodash_1.isArray)(objValue)) {
        return (0, lodash_1.mergeWith)(objValue, srcValue, (obj, src) => {
            if ((0, lodash_1.isArray)(obj)) {
                return obj.concat(src);
            }
        });
    }
    return objValue.concat(srcValue);
}
const buildConfiguration = (defaultConfigResolver_1, customConfigResolver_1, projectRoot_1, workspaceRoot_1, ...args_1) => __awaiter(void 0, [defaultConfigResolver_1, customConfigResolver_1, projectRoot_1, workspaceRoot_1, ...args_1], void 0, function* (defaultConfigResolver, customConfigResolver, projectRoot, workspaceRoot, configPath = 'jest.config.js') {
    const globalDefaultConfig = defaultConfigResolver.resolveGlobal();
    const projectDefaultConfig = defaultConfigResolver.resolveForProject(projectRoot);
    const globalCustomConfig = yield customConfigResolver.resolveGlobal(workspaceRoot);
    const projectCustomConfig = yield customConfigResolver.resolveForProject(projectRoot, configPath);
    return (0, lodash_1.mergeWith)(globalDefaultConfig, projectDefaultConfig, globalCustomConfig, projectCustomConfig, concatArrayProperties);
});
class JestConfigurationBuilder {
    constructor(defaultConfigResolver, customConfigResolver) {
        this.defaultConfigResolver = defaultConfigResolver;
        this.customConfigResolver = customConfigResolver;
    }
    buildConfiguration(projectRoot_1, workspaceRoot_1) {
        return __awaiter(this, arguments, void 0, function* (projectRoot, workspaceRoot, configPath = 'jest.config.js') {
            const pathToProject = (0, core_1.resolve)(workspaceRoot, projectRoot);
            return yield buildConfiguration(this.defaultConfigResolver, this.customConfigResolver, pathToProject, workspaceRoot, configPath);
        });
    }
}
exports.JestConfigurationBuilder = JestConfigurationBuilder;
//# sourceMappingURL=jest-configuration-builder.js.map