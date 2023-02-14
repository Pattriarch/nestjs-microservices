import { BuyCourseSagaState } from "./buy-course.state";
import { UserEntity } from "../entities/user.entity";
import { CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus } from "@purple/contracts";
import { PurchasesState } from "@purple/interfaces";

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
	public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
		const { course } = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(
			CourseGetCourse.topic,
			{
				id: this.saga.courseId
			}
		);
		if (!course) {
			throw new Error('Такого курса не существует');
		}
		if (course.price == 0) {
			this.saga.setState(PurchasesState.Purchased, course._id);
			// мы и так поменяем состояние курса, изменяя статус саги
			// this.saga.user.updateCourseStatus(course._id, PurchasesState.Purchased);
			return { paymentLink: null, user: this.saga.user };
		}
		const { paymentLink } = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(
			PaymentGenerateLink.topic,
			{
				courseId: course._id,
				userId: this.saga.user._id,
				sum: course.price
			}
		);
		this.saga.user.setCourseStatus(course._id, PurchasesState.WaitingForPayment);
		return { paymentLink, user: this.saga.user };
	}

	public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
		throw new Error('Нельзя проверить платёж, который не начался');
	}

	public async cancelPayment(): Promise<{ user: UserEntity }> {
		this.saga.setState(PurchasesState.Canceled, this.saga.courseId);
		return { user: this.saga.user };
	}
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
	public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
		throw new Error('Нельзя оплатить курс, который в процессе обработки');
	}

	public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
		const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(
			PaymentCheck.topic,
			{
				courseId: this.saga.courseId,
				userId: this.saga.user._id
			}
		);
		if (status === 'cancel') {
			this.saga.setState(PurchasesState.Canceled, this.saga.courseId);
			return { user: this.saga.user, status: 'cancel' };
		}
		if (status === 'success') {
			return { user: this.saga.user, status: 'success' };
		}
		this.saga.setState(PurchasesState.Purchased, this.saga.courseId);
		return { user: this.saga.user, status: 'progress' };
	}

	public async cancelPayment(): Promise<{ user: UserEntity }> {
		throw new Error('Нельзя отменить платёж в процессе');
	}
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
	public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
		throw new Error('Курс уже приобретён');
	}

	public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
		const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(
			PaymentCheck.topic,
			{
				courseId: this.saga.courseId,
				userId: this.saga.user._id
			}
		);
		return { user: this.saga.user, status };
	}

	public async cancelPayment(): Promise<{ user: UserEntity }> {
		throw new Error('Курс уже приобретён');
	}
}

export class BuyCourseSagaStateCanceled extends BuyCourseSagaState {
	public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
		this.saga.setState(PurchasesState.Started, this.saga.courseId);
		// переход, поменяли состояние и перешли к оплате
		return this.saga.getState().pay();
	}

	public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
		const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(
			PaymentCheck.topic,
			{
				courseId: this.saga.courseId,
				userId: this.saga.user._id
			}
		);
		return { user: this.saga.user, status };	}

	public async cancelPayment(): Promise<{ user: UserEntity }> {
		throw new Error('Курс уже был отменён');
	}
}
