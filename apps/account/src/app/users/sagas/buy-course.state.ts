import {BuyCourseSaga} from "./buy-course.saga";
import {UserEntity} from "../entities/user.entity";
import { PaymentStatus } from "@purple/contracts";

// Переход из ожидания в состояние оплаты
export abstract class BuyCourseSagaState {
	public saga: BuyCourseSaga;

	public setContext(saga: BuyCourseSaga) {
		this.saga = saga;
	}

	// оплата
	public abstract pay(): Promise<{ paymentLink: string, user: UserEntity }>;
	// состояние платежа
	public abstract checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }>;
	public abstract cancelPayment(): Promise<{ user: UserEntity }>;
}
