import { Payload } from '@nestjs/microservices';
import { Topic } from '~decorators/topic.decorator';
import { CreateUserDto } from '~dto/create-user.dto';
import { TopicEnum } from '~enums/topic.enum';
import { UserModel } from '~models/user.model';

export class ReportMicroservice {
    @Topic({ pattern: TopicEnum.GET_REPORT })
    async getReport(a: string, @Payload() createUserDto: CreateUserDto): Promise<UserModel[]> {
        return [new UserModel()];
    }
}
