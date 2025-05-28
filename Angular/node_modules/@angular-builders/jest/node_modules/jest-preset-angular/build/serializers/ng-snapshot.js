"use strict";
const attributesToRemovePatterns = ['__ngContext__'];
const removeTrailingWhiteSpaces = (serializedComponent) => {
    return serializedComponent.replace(/\n^\s*\n/gm, '\n');
};
const print = (fixture, printer, indent, opts, colors) => {
    const { componentRef, componentInstance } = fixture;
    const componentDef = componentRef.componentType.ɵcmp;
    const componentName = componentDef.selectors[0][0];
    const nodes = Array.from(componentRef.location.nativeElement.childNodes).map(printer).join('');
    let serializedComponent = '';
    if (opts.omitAllCompAttrs) {
        serializedComponent = '<' + componentName + '>\n' + indent(nodes) + '\n</' + componentName + '>';
    }
    else {
        const attributes = Object.keys(componentInstance).filter((key) => !attributesToRemovePatterns.includes(key));
        const componentAttrs = attributes
            .sort()
            .map((attribute) => {
            const compAttrVal = componentInstance[attribute];
            return (opts.spacing +
                indent(`${colors.prop.open}${attribute}${colors.prop.close}=`) +
                colors.value.open +
                (compAttrVal && compAttrVal.constructor
                    ? `{[Function ${compAttrVal.constructor.name}]}`
                    : `"${compAttrVal}"`) +
                colors.value.close);
        })
            .join('');
        serializedComponent =
            '<' +
                componentName +
                componentAttrs +
                (componentAttrs.length ? '\n' : '') +
                '>\n' +
                indent(nodes) +
                '\n</' +
                componentName +
                '>';
    }
    serializedComponent = removeTrailingWhiteSpaces(serializedComponent);
    return serializedComponent;
};
const test = (val) => !!val && typeof val === 'object' && 'componentRef' in val;
module.exports = {
    print,
    test,
};
