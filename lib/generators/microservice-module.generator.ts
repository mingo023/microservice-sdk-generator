import { serializeRelativePath } from '../helpers/file.helper';
import prettier from 'prettier';

export function microserviceModuleGenerator(currentPath: string, servicePath: string, serviceName: string): string {
    const moduleTemplate = `
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ${serviceName} } from '${serializeRelativePath(currentPath, servicePath)}'
import { CLIENT_NAME, TOPIC_PREFIX } from '${serializeRelativePath(
        currentPath,
        'lib/resources/module-config.constant'
    )}';
import { MicroserviceOptions } from '${serializeRelativePath(currentPath, 'lib/types/module-config.type')}';

@Global()
@Module({})
export class ${serviceName}Module {
    static forRoot(config: MicroserviceOptions): DynamicModule {
        return {
            module: ${serviceName}Module,
            imports: [],
            providers: [
                ${serviceName},
                {
                    provide: CLIENT_NAME,
                    useValue: config.name
                },
                {
                    provide: TOPIC_PREFIX,
                    useValue: config.topicPrefix
                }
            ],
            exports: []
        };
    }
}
`;

    return prettier.format(moduleTemplate, { parser: 'typescript', tabWidth: 4 });
}
