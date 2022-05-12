import prettier from 'prettier';
import { DocEntry } from '../types/doc-entry.type';
import { generateImport, getImports, serializeRelativePath } from '../helpers/file.helper';

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
    import { BaseMicroservice } from '${serializeRelativePath(currentPath, 'lib/resources/base-microservice.ts')}';
    import { MicroserviceHelper } from '${serializeRelativePath(currentPath, 'lib/resources/microservice-helper')}';
    import { CLIENT_NAME, TOPIC_PREFIX } from '${serializeRelativePath(
        currentPath,
        'lib/resources/module-config.constant'
    )}';
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
