import { IsString } from "class-validator";
import { PurchasesState } from "@purple/interfaces";
import { PaymentStatus } from "@purple/contracts";

export namespace AccountChangedCourse {
	export const topic = 'account.changed-course.event';

	export class Request {
		@IsString()
		useId: string;

		@IsString()
		courseId: string;

		@IsString()
		state: PurchasesState;
	}
}
