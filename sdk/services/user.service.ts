import { Injectable } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { ModuleRef } from "@nestjs/core";
import { BaseMicroservice } from "../../lib/resources/base-microservice";
import { MicroserviceHelper } from "../../lib/resources/microservice-helper";
import {
    CLIENT_NAME,
    TOPIC_PREFIX,
} from "../../lib/resources/module-config.constant";
import { TopicEnum } from "../../src/enums/topic.enum";
import { UserModel } from "../../src/models/user.model";
import { CreateUserDto } from "../../src/dto/create-user.dto";
import { CompanyModel } from "../../src/models/company.model";

@Injectable()
export class UserMicroservice extends BaseMicroservice {
    private topicPrefix: string = "";
    private client: ClientKafka;

    constructor(private moduleRef: ModuleRef) {
        super();

        this.topicPrefix = this.moduleRef.get(TOPIC_PREFIX, { strict: false });
        this.client = this.moduleRef.get(CLIENT_NAME, { strict: false });
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

    getReport(data: CreateUserDto): Promise<UserModel[]> {
        return MicroserviceHelper.with(this.client, UserModel, this.topicPrefix)
            .topic(TopicEnum.GET_REPORT)
            .data(data)
            .getMany();
    }
}
