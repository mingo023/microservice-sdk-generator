import { MessagePattern } from '@nestjs/microservices';

export function Topic({ pattern }: { pattern: string }): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        MessagePattern(pattern)(target, propertyKey, descriptor);
    };
}
