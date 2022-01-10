import path from "path";
import { ControllerInputType } from "../types/controller-input.type";

function getControllerFiles(files: string[]) {
  return files.map((file) => path.resolve(file));
}

export async function getControllerNames(
  files: string[]
): Promise<ControllerInputType[]> {
  const result: ControllerInputType[] = [];

  for (const file of getControllerFiles(files)) {
    const module = await import(file);
    for (const [className, classDeclaration] of Object.entries(module)) {
      if (className.endsWith("Controller")) {
        result.push({
          className,
          classDeclaration,
        });
      }
    }
  }

  return result;
}
