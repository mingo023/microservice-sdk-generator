import prettier from 'prettier';
import { uniq } from 'lodash';
import path from 'path';
import { DocEntry } from '../types/doc-entry.type';

export function microserviceConsumerGenerator(currentPath: string, serviceName: string, docEntries: DocEntry[]) {
    const kafkaConsumerMethods = [];
    for (const item of docEntries) {
        const modelName = getModelType(item.returnType.name);
        const getter = isArrayModel(item.returnType.name) ? 'getMany()' : 'getOne()';

        const template = `
        ${item.functionName}(data: ${item.params?.type || 'any'}): ${item.returnType.name} {
            return MicroserviceHelper.with(this.client, ${modelName}, this.topicPrefix).topic(${
            item.topic.argString
        }).data(data).${getter};
        }
    `;
        kafkaConsumerMethods.push(template);
    }

    const fileTemplate = `
    import { Injectable } from "@nestjs/common";
    import { ClientKafka } from "@nestjs/microservices";
    import { ModuleRef } from '@nestjs/core';
    import { BaseMicroservice } from "../../lib/resources/base-microservice";
    import { MicroserviceHelper } from "../../lib/resources/microservice-helper";
    import { CLIENT_NAME, TOPIC_PREFIX } from '../../lib/resources/module-config.constant';
    ${generateImport(getImports(currentPath, docEntries))}

    @Injectable()
    export class ${serviceName} extends BaseMicroservice {
        private topicPrefix: string = '';
        private client: ClientKafka;

        constructor(private moduleRef: ModuleRef) {
            super();

            this.topicPrefix = this.moduleRef.get(TOPIC_PREFIX, { strict: false })
            this.client = this.moduleRef.get(CLIENT_NAME, { strict: false })
        }

        ${kafkaConsumerMethods.join('\n')}
    }
  `;

    return prettier.format(fileTemplate, { parser: 'typescript', tabWidth: 4 });
}

function serializeRelativePath(from: string, to: string) {
    const relativePath = path.relative(path.dirname(from), to);
    if (relativePath.endsWith('.ts')) {
        return relativePath.replace('.ts', '');
    }
    return relativePath;
}

function generateImport(paths: Record<string, string[]>) {
    return Object.entries(paths)
        .map(([importPath, typeName]) => {
            return `import { ${uniq(typeName).join(', ')} } from '${importPath}';`;
        })
        .join('\n');
}

function getImports(currentPath: string, docEntries: DocEntry[]) {
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

function isArrayModel(model: string) {
    return model.includes('[]');
}

function getModelType(model: string) {
    if (model.startsWith('Promise')) {
        model = model.replace('Promise<', '').replace('>', '');
    }
    if (isArrayModel(model)) {
        return model.replace('[]', '');
    }

    return model;
}
