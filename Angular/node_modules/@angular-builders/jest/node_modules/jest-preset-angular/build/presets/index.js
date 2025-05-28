"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEsmPreset = exports.createCjsPreset = exports.defaultTransformerOptions = exports.defaultEsmPreset = exports.defaultPreset = void 0;
const serializers_1 = __importDefault(require("../serializers"));
const baseConfig = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
    snapshotSerializers: serializers_1.default,
};
const defaultTransformerOptions = {
    tsconfig: '<rootDir>/tsconfig.spec.json',
    stringifyContentPathRegex: '\\.(html|svg)$',
};
exports.defaultTransformerOptions = defaultTransformerOptions;
const defaultPreset = Object.assign(Object.assign({}, baseConfig), { transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'], transform: {
        '^.+\\.(ts|js|mjs|html|svg)$': ['jest-preset-angular', defaultTransformerOptions],
    } });
exports.defaultPreset = defaultPreset;
const defaultEsmPreset = Object.assign(Object.assign({}, baseConfig), { extensionsToTreatAsEsm: ['.ts'], moduleNameMapper: {
        tslib: 'tslib/tslib.es6.js',
    }, transform: {
        '^.+\\.(ts|js|html|svg)$': [
            'jest-preset-angular',
            Object.assign(Object.assign({}, defaultTransformerOptions), { useESM: true }),
        ],
    }, transformIgnorePatterns: ['node_modules/(?!tslib)'] });
exports.defaultEsmPreset = defaultEsmPreset;
var create_cjs_preset_1 = require("./create-cjs-preset");
Object.defineProperty(exports, "createCjsPreset", { enumerable: true, get: function () { return create_cjs_preset_1.createCjsPreset; } });
var create_esm_preset_1 = require("./create-esm-preset");
Object.defineProperty(exports, "createEsmPreset", { enumerable: true, get: function () { return create_esm_preset_1.createEsmPreset; } });
