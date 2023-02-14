import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { ConfigModule } from "@nestjs/config";
import { RMQModule, RMQService, RMQTestService } from "nestjs-rmq";
import { getRMQConfig } from "../configs/rmq.config";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "./auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { getMongoConfig } from "../configs/mongo.config";
import { INestApplication } from "@nestjs/common";
import { UserRepository } from "../users/repositories/user.repository";
import { AccountLogin, AccountRegister } from "@purple/contracts";

const authLogin: AccountLogin.Request = {
	email: 'a2@a.ru',
	password: '12345678',
}

const authRegister: AccountRegister.Request = {
	...authLogin,
	displayName: 'Дима'
}

describe('AuthController', () => {
	let app: INestApplication;
	let userRepository: UserRepository;
	// внимательно, тестовый сервис
	let rmqService: RMQTestService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({ isGlobal: true, envFilePath: 'envs/.account.env' }),
				// RMQModule.forRootAsync(getRMQConfig()),
				// преимущество тестового модуля в том, что он не требует поднятия RMQ
				RMQModule.forTest({}),
				UsersModule,
				AuthModule,
				MongooseModule.forRootAsync(getMongoConfig())
			],
		}).compile();
		app = module.createNestApplication();
		// получаем из дерева зависимостей необходимый сервис
		userRepository = app.get<UserRepository>(UserRepository);
		rmqService = app.get<RMQTestService>(RMQService);
		// запускаем приложение
		await app.init();
	});

	it('Register', async () => {
		const res = await rmqService.triggerRoute<AccountRegister.Request, AccountRegister.Response>(
			AccountRegister.topic,
			authRegister
		);
		expect(res.email).toEqual(authRegister.email);
	});

	it('Login', async () => {
		const res = await rmqService.triggerRoute<AccountLogin.Request, AccountLogin.Response>(
			AccountLogin.topic,
			authLogin
		);
		// убеждаемся, что токен сгенерировался
		expect(res.access_token).toBeDefined();
	});

	afterAll(async () => {
		// удаляем пользователя после теста
		await userRepository.deleteUser(authRegister.email);
		// закрываем приложение
		await app.close();
	});
});
