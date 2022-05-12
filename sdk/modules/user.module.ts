import { DynamicModule, Global, Module } from "@nestjs/common";
import { UserMicroservice } from "../services/user.service";
import {
    CLIENT_NAME,
    TOPIC_PREFIX,
} from "../../lib/resources/module-config.constant";
import { MicroserviceOptions } from "../../lib/types/module-config.type";

@Global()
@Module({})
export class UserMicroserviceModule {
    static forRoot(config: MicroserviceOptions): DynamicModule {
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
