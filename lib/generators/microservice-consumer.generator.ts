import { DocEntry } from "../types/doc-entry.type";

export async function microserviceConsumerGenerator(docEntries: DocEntry[]) {
  for (const item of docEntries) {
    const template = `
            async ${item.functionName}(data: ${item.params?.type || 'any'}): Promise<${item.returnType.name}> {
                return MicroserviceHelper.with(this.client, ${item.returnType.name}).topic(ABC).data(data);
            }
        `;
    console.log(template);
  }
}
