import path from 'path';
import { DocEntry } from 'lib/types/doc-entry.type';
import { uniq } from 'lodash';

export function serializeRelativePath(from: string, to: string) {
    const relativePath = path.relative(path.dirname(from), to);
    if (relativePath.endsWith('.ts')) {
        return relativePath.replace('.ts', '');
    }
    return relativePath;
}

export function generateImport(paths: Record<string, string[]>) {
    return Object.entries(paths)
        .map(([importPath, typeName]) => {
            return `import { ${uniq(typeName).join(', ')} } from '${importPath}';`;
        })
        .join('\n');
}

export function getImports(currentPath: string, docEntries: DocEntry[]) {
    const imports: Record<string, string>[] = [];
    for (const item of docEntries) {
        if (item.topic?.enumName && item.topic?.importPath) {
            imports.push({
                [item.topic.enumName]: item.topic.importPath
            });
        }
        imports.push(item.returnType.imports);
        imports.push(item.params.imports);
    }

    return imports.reduce<any>((acc, cur) => {
        const entry = Object.entries(cur)[0];
        const typeName = entry[0];
        const importPath = serializeRelativePath(currentPath, entry[1]);

        if (acc[importPath]) {
            acc[importPath].push(typeName);
        } else {
            acc[importPath] = [typeName];
        }

        return acc;
    }, {});
}
