import path from 'path';
import prettier from 'prettier';

export function microserviceModuleGenerator(currentPath: string, servicePath: string, serviceName: string): string {
    const moduleTemplate = `
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ${serviceName} } from '${getServiceRelativePath(currentPath, servicePath)}'
import { CLIENT_NAME, TOPIC_PREFIX } from '../../lib/resources/module-config.constant';
import { MicroserviceOptions } from '../../lib/resources/module-config.type';

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

function getServiceRelativePath(currentPath: string, servicePath: string): string {
    return path.relative(path.dirname(currentPath), servicePath).replace('.ts', '');
}
