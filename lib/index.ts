import 'reflect-metadata';
import { CompilerOptions, createProgram, forEachChild, ModuleKind, ScriptTarget } from 'typescript';
import { visitMicroserviceClass } from './services/analyzer';
import configs from '../gen.config.json';
import { fileGenerator } from './generators/file.generator';
import { DocEntry } from './types/doc-entry.type';
import { microserviceConsumerGenerator } from './generators/microservice-service.generator';
import { microserviceModuleGenerator } from './generators/microservice-module.generator';

export async function main(options: CompilerOptions) {
    for (const item of configs) {
        let docEntries: DocEntry[] = [];
        for (const entry of item.entry) {
            const program = createProgram([entry], options);
            const checker = program.getTypeChecker();

            for (const sourceFile of program.getSourceFiles()) {
                if (!sourceFile.isDeclarationFile) {
                    forEachChild(sourceFile, (node) => {
                        const type = checker.getTypeAtLocation(node);
                        const symbolName = type.getSymbol()?.escapedName;
                        if (!symbolName?.toString()?.endsWith('Microservice')) {
                            return;
                        }

                        docEntries.push(...(visitMicroserviceClass(checker, node) || []));
                    });
                }
            }
        }

        if (docEntries.length) {
            const serviceContent = microserviceConsumerGenerator(item.serviceOut, item.serviceName, docEntries);
            const moduleContent = microserviceModuleGenerator(item.moduleOut, item.serviceOut, item.serviceName);
            await fileGenerator(item.serviceOut, serviceContent);
            await fileGenerator(item.moduleOut, moduleContent);
        }
    }
}

main({
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
    baseUrl: './',
    paths: {
        '~*': ['src/*']
    }
});
