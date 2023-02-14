import {IsNumber, IsString} from "class-validator";
import {ICourse} from "@purple/interfaces";

export type PaymentStatus = 'cancel' | 'success' | 'progress';

export namespace PaymentCheck {
	export const topic = 'payment.check.query';

	export class Request {
		@IsString()
		courseId: string;

		@IsString()
		userId: string;
	}

	export class Response {
		// простой статус без enum'ов
		status: PaymentStatus;
	}
}
