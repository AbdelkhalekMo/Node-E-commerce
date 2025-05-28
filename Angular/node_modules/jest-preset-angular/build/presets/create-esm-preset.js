"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEsmPreset = void 0;
const utils_1 = require("./utils");
const createEsmPreset = (options = {}) => {
    return Object.assign(Object.assign({}, utils_1.basePresetConfig), { extensionsToTreatAsEsm: ['.ts'], moduleNameMapper: {
            tslib: 'tslib/tslib.es6.js',
        }, transformIgnorePatterns: ['node_modules/(?!tslib)'], transform: {
            '^.+\\.(ts|js|html|svg)$': [
                'jest-preset-angular',
                Object.assign({ tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$', useESM: true }, options),
            ],
        } });
};
exports.createEsmPreset = createEsmPreset;
