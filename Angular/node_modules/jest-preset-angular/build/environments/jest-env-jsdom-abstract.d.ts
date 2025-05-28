import type { Context } from 'node:vm';
import type { EnvironmentContext, JestEnvironment, JestEnvironmentConfig } from '@jest/environment';
import { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers';
import type { Global } from '@jest/types';
import { ModuleMocker } from 'jest-mock';
import type * as jsdom from 'jsdom';
type Win = Window & Global.Global & {
    Error: {
        stackTraceLimit: number;
    };
};
export default abstract class BaseJSDOMEnvironment implements JestEnvironment<number> {
    dom: jsdom.JSDOM | null;
    fakeTimers: LegacyFakeTimers<number> | null;
    fakeTimersModern: ModernFakeTimers | null;
    global: Win;
    private errorEventListener;
    moduleMocker: ModuleMocker | null;
    customExportConditions: string[];
    private readonly _configuredExportConditions?;
    protected constructor(config: JestEnvironmentConfig, context: EnvironmentContext, jsdomModule: typeof jsdom);
    setup(): Promise<void>;
    teardown(): Promise<void>;
    exportConditions(): Array<string>;
    getVmContext(): Context | null;
}
export {};
