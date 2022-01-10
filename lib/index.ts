import "reflect-metadata";
import {
  CompilerOptions,
  createProgram,
  forEachChild,
  ModuleKind,
  ScriptTarget,
} from "typescript";
import { getControllerNames } from "./services/file-handler";
import { visitMicroserviceClass } from "./services/serializer";
import configs from "../gen.config.json";
import { UserController } from "../src/controllers/user.controller";

export async function main(options: CompilerOptions) {
  const fileNames = configs.entries;
  const program = createProgram(fileNames, options);
  const checker = program.getTypeChecker();


  const controllers = await getControllerNames(fileNames);

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      forEachChild(sourceFile, (node) =>
        visitMicroserviceClass(checker, node, controllers)
      );
    }
  }
}

main({
  target: ScriptTarget.ES5,
  module: ModuleKind.CommonJS,
});
