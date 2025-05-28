"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNgccJestProcessor = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const ANGULAR_COMPILER_CLI_PKG_NAME = '@angular/compiler-cli';
let ngccPath = '';
try {
    ngccPath = require.resolve('@angular/compiler-cli/ngcc/main-ngcc.js');
}
catch (_a) {
    try {
        const compilerCliNgccPath = require.resolve('@angular/compiler-cli/ngcc');
        const compilerCliNgccFolder = compilerCliNgccPath.substring(0, compilerCliNgccPath.lastIndexOf(path_1.default.sep));
        ngccPath = path_1.default.resolve(compilerCliNgccFolder, 'main-ngcc.js');
    }
    catch (_b) {
    }
}
function findNodeModulesDirectory() {
    return ngccPath.substring(0, ngccPath.indexOf(ANGULAR_COMPILER_CLI_PKG_NAME.replace('/', path_1.default.sep)));
}
function findAngularCompilerCliVersion() {
    const packagePath = require.resolve(ANGULAR_COMPILER_CLI_PKG_NAME);
    const substringLength = packagePath.indexOf(ANGULAR_COMPILER_CLI_PKG_NAME.replace('/', path_1.default.sep)) +
        ANGULAR_COMPILER_CLI_PKG_NAME.length;
    const ngCompilerCliFolder = packagePath.substring(0, substringLength);
    const ngCompilerCliPackageJson = `${ngCompilerCliFolder}/package.json`;
    const { version } = require(ngCompilerCliPackageJson);
    return version;
}
const nodeModuleDirPath = findNodeModulesDirectory();
const runNgccJestProcessor = (tsconfigPath) => {
    var _a;
    const ngCompilerCliVersion = findAngularCompilerCliVersion();
    const [ngMajorVersion] = ngCompilerCliVersion.split('.');
    if (parseInt(ngMajorVersion, 10) >= 16) {
        console.warn(`
            Running 'ngcc' is not required for Angular 16+ projects. This 'ngcc-jest-processor' script will be removed in the next major version of 'jest-preset-angular'.
            Tip: To avoid this message you can remove 'jest-preset-angular/global-setup' from your jest config
        `);
        return;
    }
    if (ngccPath && nodeModuleDirPath) {
        process.stdout.write('\nngcc-jest-processor: running ngcc\n');
        const ngccBaseArgs = [
            ngccPath,
            '--source',
            nodeModuleDirPath,
            '--properties',
            ...['es2015', 'main'],
            '--first-only',
            'false',
            '--async',
        ];
        if (tsconfigPath) {
            ngccBaseArgs.push(...['--tsconfig', tsconfigPath]);
        }
        const { status, error } = (0, child_process_1.spawnSync)(process.execPath, ngccBaseArgs, {
            stdio: ['inherit', process.stderr, process.stderr],
        });
        if (status !== 0) {
            const errorMessage = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : '';
            throw new Error(`${errorMessage} NGCC failed ${errorMessage ? ', see above' : ''}.`);
        }
        return;
    }
    console.warn(`Warning: Could not locate '@angular/compiler-cli' to run 'ngcc' automatically.` +
        `Please make sure you are running 'ngcc-jest-processor.js' from root level of your project.` +
        `'ngcc' must be run before running Jest`);
};
exports.runNgccJestProcessor = runNgccJestProcessor;
