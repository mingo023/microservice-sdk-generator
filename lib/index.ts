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
        const program = createProgram([item.entry], options);
        const checker = program.getTypeChecker();

        let docEntries: DocEntry[] = [];
        let serviceName: string = '';
        for (const sourceFile of program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                forEachChild(sourceFile, (node) => {
                    const type = checker.getTypeAtLocation(node);
                    const symbolName = type.getSymbol()?.escapedName;
                    if (!symbolName?.toString()?.endsWith('Microservice')) {
                        return;
                    }
                    serviceName = symbolName;

                    docEntries = visitMicroserviceClass(checker, node) || [];
                });
            }
        }

        if (docEntries.length) {
            const serviceContent = microserviceConsumerGenerator(item.serviceOut, serviceName, docEntries);
            const moduleContent = microserviceModuleGenerator(item.moduleOut, item.serviceOut,serviceName);
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
