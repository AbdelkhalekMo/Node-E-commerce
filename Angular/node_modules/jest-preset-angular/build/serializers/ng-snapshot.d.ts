import type { OldPlugin } from 'pretty-format';
type PluginPrintFnArgs = Parameters<OldPlugin['print']>;
type NgSnapshotOptions = {
    omitAllCompAttrs?: boolean;
};
type PluginPrintFn = (fixture: PluginPrintFnArgs[0], printer: PluginPrintFnArgs[1], indent: PluginPrintFnArgs[2], opts: PluginPrintFnArgs[3] & NgSnapshotOptions, colors: PluginPrintFnArgs[4]) => string;
declare const _default: {
    print: PluginPrintFn;
    test: (arg0: any) => boolean;
};
export = _default;
