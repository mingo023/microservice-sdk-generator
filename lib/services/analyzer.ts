import * as tsc from "typescript";
import { microserviceConsumerGenerator } from "../generators/microservice-consumer.generator";
import { ControllerInputType } from "../types/controller-input.type";
import { DocEntry } from "../types/doc-entry.type";

function isNodeExported(node: tsc.Node): boolean {
  return (
    (tsc.getCombinedModifierFlags(node as tsc.Declaration) &
      tsc.ModifierFlags.Export) !==
      0 ||
    (!!node.parent && node.parent.kind === tsc.SyntaxKind.SourceFile)
  );
}

export function visitMicroserviceClass(
  checker: tsc.TypeChecker,
  node: tsc.Node,
  controllers: ControllerInputType[]
) {
  // Only consider exported nodes
  if (!isNodeExported(node)) {
    return;
  }

  if (tsc.isClassDeclaration(node) && node.name) {
    // This is a top level class, get its symbol
    let symbol = checker.getSymbolAtLocation(node.name);
    const matchedController = controllers.find(
      (item) => item.className === symbol?.getName()
    );
    if (!matchedController) {
      return;
    }

    const docEntries: DocEntry[] = [];
    // console.log(node.decorators);

    node.forEachChild((child) => {
      if (!tsc.isMethodDeclaration(child)) {
        return;
      }
      const topicDecorator = (child.decorators || []).find((item) => {
        const expression: tsc.CallExpression =
          item.expression as tsc.CallExpression;
        const decoratorIdentifier = expression.expression as tsc.Identifier;
        return decoratorIdentifier.escapedText === "Topic";
      });
      if (!topicDecorator) {
        return;
      }
      const docEntry: Partial<DocEntry> = {
        functionName: child.name.getText(),
        topic: {
          ...serializeTopicDecorator(topicDecorator, checker),
        }
      };
      docEntries.push(docEntry as DocEntry);

      const signature = checker.getSignatureFromDeclaration(child);
      if (!signature) {
        return;
      }

      /**
       * analyze return type of the function
       */
      const returnTypePathDic: Record<string, string[]> = {};
      const type = checker.getReturnTypeOfSignature(signature);
      analyzeType(type, checker, checker.typeToString(type), returnTypePathDic);
      /**
       * set return type information into docEntry
       */
      const returnTypePathEntries = Object.entries(returnTypePathDic);
      docEntry.returnType = {
        name: returnTypePathEntries[0][0],
        imports: returnTypePathEntries[0][1],
      };

      /**
       * analyzer topic
       */

      /**
       * get microservice payload parameter
       */
      const valueInputIndexMeta = Reflect.getMetadata(
        "__routeArguments__",
        matchedController.classDeclaration,
        child.name.getText()
      );
      if (!valueInputIndexMeta) {
        return;
      }

      const valueInputIndex = Object.entries(valueInputIndexMeta)[0][1] as {
        index: number;
      };
      const childParam = child.parameters.find(
        (item, index) => index === valueInputIndex.index
      );
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
      const paramTypePathDic: Record<string, string[]> = {};
      const paramName = checker.typeToString(paramType);
      analyzeType(paramType, checker, paramName, paramTypePathDic);

      /**
       * set payload parameter type information into docEntry
       */
      docEntry.params = {
        name: childParam.name.getText(),
        type: paramName,
        imports: paramTypePathDic[paramName],
      };
    });

    // console.log(JSON.stringify(docEntries, null, 2));
    microserviceConsumerGenerator(docEntries);
  }
}

function serializeTopicDecorator(
  decorator: tsc.Decorator,
  checker: tsc.TypeChecker
) {
  const expression: tsc.CallExpression = decorator!
    .expression as tsc.CallExpression;
  const arg = expression.arguments[0] as tsc.PropertyAccessExpression;
  const argIdentifier = arg.expression as tsc.Identifier;
  const enumSymbol = checker.getSymbolAtLocation(arg);

  const importPath = enumSymbol
    ?.getDeclarations()?.[0]
    .getSourceFile().fileName;
  const enumName = argIdentifier?.getFullText();
  let argString = arg?.getFullText();
  if (!enumName) {
    const type = checker.getTypeAtLocation(arg) as tsc.StringLiteralType;
    argString = `'${type.value}'`;
  }

  return {
    argString,
    enumName,
    importPath: enumName && importPath,
  };
}

export function analyzeType(
  type: tsc.Type,
  checker: tsc.TypeChecker,
  typeName: string,
  typePathDic: Record<string, string[]>
) {
  const name = type.getSymbol()?.getName();
  const importPath = type
    .getSymbol()
    ?.getDeclarations()?.[0]
    ?.getSourceFile().fileName;

  if (type.isUnionOrIntersection()) {
    type.types.map((child) =>
      analyzeType(child, checker, typeName, typePathDic)
    );
  } else if (name === "Promise") {
    const argType = (type as tsc.TypeReference).typeArguments![0];
    analyzeType(argType, checker, checker.typeToString(argType), typePathDic);
  } else if (importPath?.indexOf("node_modules/typescript/lib") !== -1) {
    const arg = checker.getTypeArguments(type as tsc.TypeReference)[0];
    if (!arg) {
      typePathDic[typeName] = [];
      return;
    }
    analyzeType(arg, checker, typeName, typePathDic);
  } else {
    typePathDic[typeName] = [...(typePathDic[typeName] || []), importPath];
  }
}
