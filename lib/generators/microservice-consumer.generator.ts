import { DocEntry } from "../types/doc-entry.type";

export async function microserviceConsumerGenerator(docEntries: DocEntry[]) {
  const kafkaConsumers = []
  for (const item of docEntries) {
    const template = `
            async ${item.functionName}(data: ${item.params?.type || 'any'}): Promise<${item.returnType.name}> {
                return MicroserviceHelper.with(this.client, ${getModelType(item.returnType.name)}).topic(${item.topic.argString}).data(data).${isArrayModel(item.returnType.name) ? 'getMany' : 'getOne'}();
            }
        `;
    kafkaConsumers.push(template);
  }

  const fileTemplate = `
    @Injectable()
    export class EsgService extends BaseMicroservice {
        constructor(@Inject(ESG_CLIENT) private client: ClientKafka, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
            super();
        }

        ${kafkaConsumers.join('\n')}
    }
  `

  console.log(fileTemplate);
}

function isArrayModel(model: string) {
  return model.endsWith('[]')
}

function getModelType(model: string) {
  if (isArrayModel(model)) {
    return model.replace('[]', '')
  }

  return model
}