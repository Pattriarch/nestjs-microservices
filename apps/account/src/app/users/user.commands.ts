import { Body, Controller } from '@nestjs/common';
import { UserRepository } from "./repositories/user.repository";
import { RMQRoute, RMQService, RMQValidate } from "nestjs-rmq";
import { AccountBuyCourse, AccountChangeProfile, AccountCheckPayment } from "@purple/contracts";
import { UserEntity } from "./entities/user.entity";
import { BuyCourseSaga } from "./sagas/buy-course.saga";
import { UsersService } from "./users.service";

@Controller()
export class UserCommands {
	constructor(private readonly usersService: UsersService) {}

	@RMQValidate()
	@RMQRoute(AccountChangeProfile.topic)
	async changeProfile(@Body() { user, id }: AccountChangeProfile.Request): Promise<AccountChangeProfile.Response> {
		return this.usersService.changeProfile(user, id);
	}

	@RMQValidate()
	@RMQRoute(AccountBuyCourse.topic)
	async buyCourse(@Body() { userId, courseId }: AccountBuyCourse.Request): Promise<AccountBuyCourse.Response> {
		return this.usersService.buyCourse(userId, courseId);
	}

	@RMQValidate()
	@RMQRoute(AccountCheckPayment.topic)
	async checkPayment(@Body() {
		userId,
		courseId
	}: AccountCheckPayment.Request): Promise<AccountCheckPayment.Response> {
		return this.usersService.checkPayment(userId, courseId);
	}
}
