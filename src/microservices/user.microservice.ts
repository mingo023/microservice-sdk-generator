import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from '../dto/create-user.dto';
import { TopicEnum } from '../enums/topic.enum';
import { CompanyModel } from '../models/company.model';
import { UserModel } from '../models/user.model';

export class Person {}

function Topic(value: string): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        MessagePattern(value)(target, propertyKey, descriptor);
    };
}

export class UserMicroservice {
    @Topic(TopicEnum.GET_USER)
    async getUsers(a: string, @Payload('value') createUserDto: CreateUserDto): Promise<UserModel[]> {
        return [new UserModel()];
    }
    @Topic(TopicEnum.GET_COMPANY)
    async getCompany(a: string, @Payload('value') createUserDto: CreateUserDto): Promise<CompanyModel> {
        return new CompanyModel();
    }
}
