import { Injectable } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { BaseMicroservice } from "../../lib/core/base-microservice";
import { MicroserviceHelper } from "../../lib/core/microservice-helper";
import { TopicEnum } from "../../src/enums/topic.enum";
import { UserModel } from "../../src/models/user.model";
import { CreateUserDto } from "../../src/dto/create-user.dto";
import { CompanyModel } from "../../src/models/company.model";

@Injectable()
export class UserMicroservice extends BaseMicroservice {
    constructor(private client: ClientKafka, private topicPrefix: string) {
        super();
    }

    getUsers(data: CreateUserDto): Promise<UserModel[]> {
        return MicroserviceHelper.with(this.client, UserModel, this.topicPrefix)
            .topic(TopicEnum.GET_USER)
            .data(data)
            .getMany();
    }

    getCompany(data: CreateUserDto): Promise<CompanyModel> {
        return MicroserviceHelper.with(
            this.client,
            CompanyModel,
            this.topicPrefix
        )
            .topic(TopicEnum.GET_COMPANY)
            .data(data)
            .getOne();
    }
}
