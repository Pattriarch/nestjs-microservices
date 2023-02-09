import {JwtModuleAsyncOptions} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {IRMQServiceAsyncOptions} from "nestjs-rmq";

export const getRMQConfig = (): IRMQServiceAsyncOptions => {
	return {
		inject: [ConfigService],
		imports: [ConfigModule],
		useFactory: (configService: ConfigService) => ({
			exchangeName: configService.get('AMQP_EXCHANGE') ?? '',
			connections: [
				{
					login: configService.get('AMQP_USER') ?? '',
					password: configService.get('AMQP_PASSWORD') ?? '',
					host: configService.get('AMQP_HOST') ?? ''
				}
			],
			queueName: configService.get('AMQP_QUEUE') ?? '',
			prefetchCount: 32, // 32 сообщения одновременно обрабатываем
			serviceName: 'purple-account' // при обмене сообщений получаем название сервиса
		})
	}
}
