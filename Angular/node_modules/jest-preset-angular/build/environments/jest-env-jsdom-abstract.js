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
const fake_timers_1 = require("@jest/fake-timers");
const jest_mock_1 = require("jest-mock");
const jest_util_1 = require("jest-util");
function isString(value) {
    return typeof value === 'string';
}
class BaseJSDOMEnvironment {
    constructor(config, context, jsdomModule) {
        this.customExportConditions = ['browser'];
        const { projectConfig } = config;
        const { JSDOM, ResourceLoader, VirtualConsole } = jsdomModule;
        const virtualConsole = new VirtualConsole();
        virtualConsole.sendTo(context.console, { omitJSDOMErrors: true });
        virtualConsole.on('jsdomError', (error) => {
            context.console.error(error);
        });
        this.dom = new JSDOM(typeof projectConfig.testEnvironmentOptions.html === 'string'
            ? projectConfig.testEnvironmentOptions.html
            : '<!DOCTYPE html>', Object.assign({ pretendToBeVisual: true, resources: typeof projectConfig.testEnvironmentOptions.userAgent === 'string'
                ? new ResourceLoader({
                    userAgent: projectConfig.testEnvironmentOptions.userAgent,
                })
                : undefined, runScripts: 'dangerously', url: 'http://localhost/', virtualConsole }, projectConfig.testEnvironmentOptions));
        const global = (this.global = this.dom.window);
        if (global == null) {
            throw new Error('JSDOM did not return a Window object');
        }
        global.global = global;
        this.global.Error.stackTraceLimit = 100;
        (0, jest_util_1.installCommonGlobals)(global, projectConfig.globals);
        this.errorEventListener = (event) => {
            if (userErrorListenerCount === 0 && event.error != null) {
                process.emit('uncaughtException', event.error);
            }
        };
        global.addEventListener('error', this.errorEventListener);
        const originalAddListener = global.addEventListener.bind(global);
        const originalRemoveListener = global.removeEventListener.bind(global);
        let userErrorListenerCount = 0;
        global.addEventListener = function (...args) {
            if (args[0] === 'error') {
                userErrorListenerCount++;
            }
            return originalAddListener.apply(this, args);
        };
        global.removeEventListener = function (...args) {
            if (args[0] === 'error') {
                userErrorListenerCount--;
            }
            return originalRemoveListener.apply(this, args);
        };
        if ('customExportConditions' in projectConfig.testEnvironmentOptions) {
            const { customExportConditions } = projectConfig.testEnvironmentOptions;
            if (Array.isArray(customExportConditions) && customExportConditions.every(isString)) {
                this._configuredExportConditions = customExportConditions;
            }
            else {
                throw new Error('Custom export conditions specified but they are not an array of strings');
            }
        }
        this.moduleMocker = new jest_mock_1.ModuleMocker(global);
        this.fakeTimers = new fake_timers_1.LegacyFakeTimers({
            config: projectConfig,
            global: global,
            moduleMocker: this.moduleMocker,
            timerConfig: {
                idToRef: (id) => id,
                refToId: (ref) => ref,
            },
        });
        this.fakeTimersModern = new fake_timers_1.ModernFakeTimers({
            config: projectConfig,
            global: global,
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fakeTimers) {
                this.fakeTimers.dispose();
            }
            if (this.fakeTimersModern) {
                this.fakeTimersModern.dispose();
            }
            if (this.global != null) {
                if (this.errorEventListener) {
                    this.global.removeEventListener('error', this.errorEventListener);
                }
                this.global.close();
            }
            this.errorEventListener = null;
            this.global = null;
            this.dom = null;
            this.fakeTimers = null;
            this.fakeTimersModern = null;
        });
    }
    exportConditions() {
        var _a;
        return (_a = this._configuredExportConditions) !== null && _a !== void 0 ? _a : this.customExportConditions;
    }
    getVmContext() {
        if (this.dom) {
            return this.dom.getInternalVMContext();
        }
        return null;
    }
}
exports.default = BaseJSDOMEnvironment;
