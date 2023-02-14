import { RMQService } from "nestjs-rmq";
import { Injectable } from "@nestjs/common";
import { UserEntity } from "./users/entities/user.entity";

@Injectable()
export class UserEventEmitter {
	constructor(private readonly rmqService: RMQService) {
	}

	async handle(user: UserEntity) {
		for (const event of user.events) {
			// notify - тк он не требует ответа
			await this.rmqService.notify(event.topic, event.data);
		}
	}
}
