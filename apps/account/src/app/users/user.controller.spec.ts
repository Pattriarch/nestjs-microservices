import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RMQModule, RMQService, RMQTestService } from "nestjs-rmq";
import { UsersModule } from "./users.module";
import { MongooseModule } from "@nestjs/mongoose";
import { getMongoConfig } from "../configs/mongo.config";
import { INestApplication } from "@nestjs/common";
import { UserRepository } from "./repositories/user.repository";
import {
	AccountBuyCourse, AccountCheckPayment,
	AccountLogin,
	AccountRegister,
	AccountUserInfo,
	CourseGetCourse, PaymentCheck,
	PaymentGenerateLink
} from "@purple/contracts";
import { verify } from "jsonwebtoken";
import { AuthModule } from "../auth/auth.module";

const authLogin: AccountLogin.Request = {
	email: 'a4@a.ru',
	password: '12345678',
}

const authRegister: AccountRegister.Request = {
	...authLogin,
	displayName: 'Дима'
}

const courseId = 'courseId';
const paymentLink = 'paymentLink';

describe('UserController', () => {
	let app: INestApplication;
	let userRepository: UserRepository;
	// внимательно, тестовый сервис
	let rmqService: RMQTestService;
	let configService: ConfigService;
	let token: string;
	let userId: string;

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
		// вытаскиваем конфиг-сервис
		configService = app.get<ConfigService>(ConfigService);
		// запускаем приложение
		await app.init();

		// регистрируем пользователя перед каждым запуском
		await rmqService.triggerRoute<AccountRegister.Request, AccountRegister.Response>(
			AccountRegister.topic,
			authRegister
		);
		// и логинимся в аккаунт
		const { access_token } = await rmqService.triggerRoute<AccountLogin.Request, AccountLogin.Response>(
			AccountLogin.topic,
			authLogin
		);
		token = access_token;
		// от verify мы получаем расшифрованный токен
		// если ничего не получили, то все плохо
		const data = verify(token, configService.get('JWT_SECRET'));
		// получаем id пользователя из токена
		userId = data[ 'id' ];
	});

	it('AccountUserInfo', async () => {
		const res = await rmqService.triggerRoute<AccountUserInfo.Request, AccountUserInfo.Response>(
			AccountUserInfo.topic,
			{ id: userId }
		);
		expect(res.profile.displayName).toEqual(authRegister.displayName);
	});

	it('BuyCourse', async () => {
		rmqService.mockReply<CourseGetCourse.Response>(CourseGetCourse.topic, {
			course: {
				_id: courseId,
				price: 1000
			}
		});
		rmqService.mockReply<PaymentGenerateLink.Response>(PaymentGenerateLink.topic, {
			paymentLink
		});
		const res = await rmqService.triggerRoute<AccountBuyCourse.Request, AccountBuyCourse.Response>(
			AccountBuyCourse.topic,
			{ userId, courseId }
		);
		expect(res.paymentLink).toEqual(paymentLink);

		// тк наша сага меняет состояние с Started на WaitingForPayment
		// то мы можем ожидать получение ошибки при попытке оплатить снова

		await expect(
			rmqService.triggerRoute<AccountBuyCourse.Request, AccountBuyCourse.Response>(
				AccountBuyCourse.topic,
				{ userId, courseId }
			)
		).rejects.toThrowError();
	});

	it('AccountCheckPayment', async () => {
		const expectedStatus = 'success'
		rmqService.mockReply<PaymentCheck.Response>(PaymentCheck.topic, {
			status: expectedStatus
		});

		const { status } = await rmqService.triggerRoute<AccountCheckPayment.Request, AccountCheckPayment.Response>(
			AccountCheckPayment.topic,
			{ userId, courseId }
		)

		expect(status).toEqual(expectedStatus);
	});

	afterAll(async () => {
		// удаляем пользователя после теста
		await userRepository.deleteUser(authRegister.email);
		// закрываем приложение
		await app.close();
	});
});
