import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { MicroserviceHelper } from '../../../lib/core/microservice-helper';
import { BaseMicroservice } from '../../../lib/core/base-microservice';
import { TopicEnum } from '../../enums/topic.enum';
import { UserModel } from '../../models/user.model';
import { CreateUserDto } from '../../dto/create-user.dto';
import { CompanyModel } from '../../models/company.model';

@Injectable()
export class UserMicroservice extends BaseMicroservice {
    constructor(private client: ClientKafka, private topicPrefix: string) {
        super();
    }

    getUsers(data: CreateUserDto): MicroserviceHelper<UserModel> {
        return MicroserviceHelper.with(this.client, UserModel, this.topicPrefix).topic(TopicEnum.GET_USER).data(data);
    }

    getCompany(data: CreateUserDto): MicroserviceHelper<CompanyModel> {
        return MicroserviceHelper.with(this.client, CompanyModel, this.topicPrefix)
            .topic(TopicEnum.GET_COMPANY)
            .data(data);
    }
}
