"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const create_cjs_preset_1 = require("./create-cjs-preset");
const create_esm_preset_1 = require("./create-esm-preset");
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
const defaultPreset = Object.assign(Object.assign({}, baseConfig), { transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'], transform: {
        '^.+\\.(ts|js|mjs|html|svg)$': ['jest-preset-angular', defaultTransformerOptions],
    } });
const defaultEsmPreset = Object.assign(Object.assign({}, baseConfig), { extensionsToTreatAsEsm: ['.ts'], moduleNameMapper: {
        tslib: 'tslib/tslib.es6.js',
    }, transform: {
        '^.+\\.(ts|js|html|svg)$': [
            'jest-preset-angular',
            Object.assign(Object.assign({}, defaultTransformerOptions), { useESM: true }),
        ],
    }, transformIgnorePatterns: ['node_modules/(?!tslib)'] });
const presetEntries = {
    get defaults() {
        console.warn(`
            This preset is DEPRECATED and will be removed in the next major release.
            Please use "createCjsPreset" function instead. See documentation at https://thymikee.github.io/jest-preset-angular/docs/getting-started/presets#createcjspresetoptions
        `);
        return defaultPreset;
    },
    get defaultsESM() {
        console.warn(`
            This preset is DEPRECATED and will be removed in the next major release.
            Please use "createEsmPreset" function instead. See documentation at https://thymikee.github.io/jest-preset-angular/docs/getting-started/presets#createesmpresetoptions
        `);
        return defaultEsmPreset;
    },
    get defaultTransformerOptions() {
        console.warn(`
            These options are DEPRECATED and will be removed in the next major release.
            Please use "createCjsPreset" or "createEsmPreset" function instead. See documentation at https://thymikee.github.io/jest-preset-angular/docs/getting-started/presets
        `);
        return defaultTransformerOptions;
    },
    createCjsPreset: create_cjs_preset_1.createCjsPreset,
    createEsmPreset: create_esm_preset_1.createEsmPreset,
};
module.exports = presetEntries;
