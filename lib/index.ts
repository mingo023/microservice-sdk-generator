import 'reflect-metadata';
import { CompilerOptions, createProgram, forEachChild, ModuleKind, ScriptTarget } from 'typescript';
import { getControllerNames } from './services/file-handler';
import { visitMicroserviceClass } from './services/analyzer';
import configs from '../gen.config.json';
import { fileGenerator } from './generators/file.generator';
import { microserviceConsumerGenerator } from './generators/microservice-consumer.generator';
import { DocEntry } from './types/doc-entry.type';

export async function main(options: CompilerOptions) {
    for (const item of configs) {
        const program = createProgram([item.entry], options);
        const checker = program.getTypeChecker();

        const controllers = await getControllerNames([item.entry]);

        let docEntries: DocEntry[] = [];
        let serviceName: string = '';
        for (const sourceFile of program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                forEachChild(sourceFile, (node) => {
                    const type = checker.getTypeAtLocation(node);
                    const symbolName = type.getSymbol()?.escapedName;
                    if (!symbolName?.endsWith('Microservice')) {
                        return;
                    }
                    serviceName = symbolName;

                    docEntries = visitMicroserviceClass(checker, node, controllers, item.out) || [];
                });
            }
        }

        if (docEntries.length) {
            const fileContent = microserviceConsumerGenerator(item.out, serviceName, docEntries);
            await fileGenerator(item.out, fileContent);
        }
    }
}

main({
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS
});
