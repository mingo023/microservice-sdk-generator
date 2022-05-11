import { DynamicModule, Global, Module } from "@nestjs/common";
import { UserMicroservice } from "../services/user.service";
import {
    CLIENT_NAME,
    TOPIC_PREFIX,
} from "../../lib/core/module-config.constant";

@Global()
@Module({})
export class UserMicroserviceModule {
    static forRoot(config: any): DynamicModule {
        return {
            module: UserMicroserviceModule,
            imports: [],
            providers: [
                UserMicroservice,
                {
                    provide: CLIENT_NAME,
                    useValue: config.name,
                },
                {
                    provide: TOPIC_PREFIX,
                    useValue: config.topicPrefix,
                },
            ],
            exports: [],
        };
    }
}
