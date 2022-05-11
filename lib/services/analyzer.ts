import tsc from 'typescript';
import { ControllerInputType } from '../types/controller-input.type';
import { DocEntry } from '../types/doc-entry.type';

export function visitMicroserviceClass(
    checker: tsc.TypeChecker,
    node: tsc.Node,
    controllers: ControllerInputType[],
) {
    if (!isNodeExported(node)) {
        return;
    }

    if (tsc.isClassDeclaration(node) && node.name) {
        let symbol = checker.getSymbolAtLocation(node.name);
        const matchedController = controllers.find((item) => item.className === symbol?.getName());
        if (!matchedController) {
            return;
        }

        const docEntries: DocEntry[] = [];

        node.forEachChild((child) => {
            if (!tsc.isMethodDeclaration(child)) {
                return;
            }

            const topicParams = analyzeTopicDecorators(child.decorators!, checker);
            if (!topicParams) {
                return;
            }
            const docEntry: DocEntry = {
                functionName: child.name.getText(),
                returnType: {
                    imports: {},
                    name: 'any'
                },
                params: {
                    type: 'any',
                    imports: {}
                },
                topic: topicParams
            };
            docEntries.push(docEntry as DocEntry);

            /**
             * analyze return type of the function
             */
            const signature = checker.getSignatureFromDeclaration(child);
            if (!signature) {
                return;
            }
            const type = checker.getReturnTypeOfSignature(signature);
            analyzeType(type, checker, docEntry.returnType.imports);
            docEntry.returnType.name = checker.typeToString(type);

            /**
             * get microservice payload parameter
             */
            const valueInputIndexMeta = Reflect.getMetadata(
                '__routeArguments__',
                matchedController.classDeclaration,
                child.name.getText()
            );
            if (!valueInputIndexMeta) {
                return;
            }

            const valueInputIndex = Object.entries(valueInputIndexMeta)[0][1] as {
                index: number;
            };
            const childParam = child.parameters.find((_, index) => index === valueInputIndex.index);
            if (!childParam) {
                return;
            }

            /**
             * analyze payload parameter type
             */
            const paramType = checker.getTypeAtLocation(childParam);
            if (!paramType) {
                return;
            }
            const paramTypeName = checker.typeToString(paramType);
            analyzeType(paramType, checker, docEntry.params.imports);
            docEntry.params.type = paramTypeName;
        });

        return docEntries;
    }
}

function analyzeTopicDecorators(decorators: tsc.NodeArray<tsc.Decorator>, checker: tsc.TypeChecker) {
    if (!decorators) {
        return;
    }

    const topicDecorator = (decorators || []).find((item) => {
        const expression: tsc.CallExpression = item.expression as tsc.CallExpression;
        const decoratorIdentifier = expression.expression as tsc.Identifier;
        return decoratorIdentifier.escapedText === 'Topic';
    });
    if (!topicDecorator) {
        return;
    }

    const expression: tsc.CallExpression = topicDecorator.expression as tsc.CallExpression;
    const arg = expression.arguments[0] as tsc.PropertyAccessExpression;
    const argIdentifier = arg.expression as tsc.Identifier;
    const enumSymbol = checker.getSymbolAtLocation(arg);

    const importPath = enumSymbol?.getDeclarations()?.[0].getSourceFile().fileName;
    const enumName = argIdentifier?.getFullText();
    let argString = arg?.getFullText();
    if (!enumName) {
        const type = checker.getTypeAtLocation(arg) as tsc.StringLiteralType;
        argString = `'${type.value}'`;
    }

    return {
        argString,
        enumName,
        importPath: enumName && importPath
    };
}

export function analyzeType(type: tsc.Type, checker: tsc.TypeChecker, typePathDic: Record<string, string>) {
    const name = type.getSymbol()?.getName() || 'any';
    const importPath = type.getSymbol()?.getDeclarations()?.[0]?.getSourceFile().fileName;

    if (type.isUnionOrIntersection()) {
        type.types.map((child) => analyzeType(child, checker, typePathDic));
    } else if (name === 'Promise') {
        const argType = (type as tsc.TypeReference).typeArguments![0];
        analyzeType(argType, checker, typePathDic);
    } else if (importPath?.indexOf('typescript/lib') !== -1) {
        const arg = checker.getTypeArguments(type as tsc.TypeReference)[0];
        if (!arg) {
            return;
        }
        analyzeType(arg, checker, typePathDic);
    } else {
        typePathDic[name] = importPath;
    }
}

function isNodeExported(node: tsc.Node): boolean {
    return (
        (tsc.getCombinedModifierFlags(node as tsc.Declaration) & tsc.ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === tsc.SyntaxKind.SourceFile)
    );
}
