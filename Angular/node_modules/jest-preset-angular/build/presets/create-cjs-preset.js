"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCjsPreset = void 0;
const utils_1 = require("./utils");
const createCjsPreset = (options = {}) => {
    return Object.assign(Object.assign({}, utils_1.basePresetConfig), { transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'], transform: {
            '^.+\\.(ts|js|mjs|html|svg)$': [
                'jest-preset-angular',
                Object.assign({ tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' }, options),
            ],
        } });
};
exports.createCjsPreset = createCjsPreset;
