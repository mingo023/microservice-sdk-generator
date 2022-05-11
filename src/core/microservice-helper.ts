import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Cache, CachingConfig } from 'cache-manager';
import md5 from 'md5';

export class MicroserviceHelper<Model> {
    private topicName: string;
    private payload: any;
    private cacheManager: Cache;
    private cacheConfig?: CachingConfig;

    static with<Model>(client: ClientKafka, model: { new (): Model }, topicPrefix: string) {
        return new MicroserviceHelper<Model>(client, model, topicPrefix);
    }

    private constructor(private client: ClientKafka, private model: { new (): Model }, private topicPrefix: string) {}

    topic(name: string): MicroserviceHelper<Model> {
        this.topicName = `${this.topicPrefix}${name}`;
        return this;
    }

    data(data: any): MicroserviceHelper<Model> {
        this.payload = data;
        return this;
    }

    withCache(cacheManger: Cache, cacheConfig: CachingConfig): MicroserviceHelper<Model> {
        this.cacheManager = cacheManger;
        this.cacheConfig = cacheConfig;
        return this;
    }

    async getOne(): Promise<Model> {
        let data = await this.getMany();
        return data[0];
    }

    async getMany(): Promise<Model[]> {
        let data = await this.execute();
        if (Array.isArray(data)) {
            return plainToInstance(this.model, data);
        } else {
            return [plainToInstance(this.model, data)];
        }
    }

    private async execute<T>(): Promise<T> {
        let handler = () => this.toPromise<T>(this.client.send(this.topicName, this.payload || {}));

        if (this.cacheManager) {
            const key = md5(this.topicName + JSON.stringify(this.payload || {}));
            const cachedData = await this.cacheManager.get<T>(key);

            if (!cachedData) {
                const data = await handler();
                await this.cacheManager.set(key, data, this.cacheConfig);
                return data;
            }

            return cachedData;
        }

        return handler();
    }

    private async toPromise<T>(observe: Observable<T>) {
        try {
            return await firstValueFrom(observe);
        } catch (error: any) {
            if (error.code) {
                let httpError = new HttpException(error.description, error.code) as any;
                httpError['response' as any] = error.errors;
                httpError.message = error.message;
                throw httpError;
            } else {
                throw error;
            }
        }
    }
}
