import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import BaseEnv from './jest-env-jsdom-abstract';
export default class JestJSDOMEnvironment extends BaseEnv {
    constructor(config: JestEnvironmentConfig, context: EnvironmentContext);
}
