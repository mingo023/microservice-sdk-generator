import { Payload } from '@nestjs/microservices';
import { Topic } from '~decorators/topic.decorator';
import { CreateUserDto } from '~dto/create-user.dto';
import { TopicEnum } from '~enums/topic.enum';
import { CompanyModel } from '~models/company.model';
import { UserModel } from '~models/user.model';

export class UserMicroservice {
    @Topic({ pattern: TopicEnum.GET_USER })
    async getUsers(a: string, @Payload('value') createUserDto: CreateUserDto): Promise<UserModel[]> {
        return [new UserModel()];
    }

    @Topic({ pattern: TopicEnum.GET_COMPANY })
    async getCompany(a: string, @Payload('value') createUserDto: CreateUserDto): Promise<CompanyModel> {
        return new CompanyModel();
    }
}
