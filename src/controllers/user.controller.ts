import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreateUserDto } from "../dto/create-user.dto";
import { TEST, TopicEnum } from "../enums/topic.enum";
import { CompanyModel } from "../models/company.model";
import { UserModel } from "../models/user.model";

export class Person {}

export class UserController {
  @MessagePattern(TopicEnum.GET_USER)
  async getUser(
    a: string,
    @Payload("value") createUserDto: CreateUserDto
  ): Promise<UserModel[] | CompanyModel> {
    return [new UserModel()];
  }

  async getCompany(): Promise<CompanyModel> {
    return new CompanyModel();
  }
}
