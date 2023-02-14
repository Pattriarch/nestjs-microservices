import {UserEntity} from "../entities/user.entity";
import {RMQService} from "nestjs-rmq";
import {PurchasesState} from "@purple/interfaces";
import {BuyCourseSagaState} from "./buy-course.state";
import {
	BuyCourseSagaStateCanceled,
	BuyCourseSagaStatePurchased,
	BuyCourseSagaStateStarted,
	BuyCourseSagaStateWaitingForPayment
} from "./buy-course.steps";

export class BuyCourseSaga {
	private state: BuyCourseSagaState;

	constructor(
		public user: UserEntity,
		public courseId: string,
		public rmqService: RMQService
	) {
		this.setState(user.getCourseState(courseId), courseId);
	}

	setState(state: PurchasesState, courseId: string) {
		switch(state) {
			case PurchasesState.Started:
				this.state = new BuyCourseSagaStateStarted();
				break;
			case PurchasesState.WaitingForPayment:
				this.state = new BuyCourseSagaStateWaitingForPayment();
				break;
			case PurchasesState.Purchased:
				this.state = new BuyCourseSagaStatePurchased();
				break;
			case PurchasesState.Canceled:
				this.state = new BuyCourseSagaStateCanceled();
				break;
		}
		// установка контекста
		this.state.setContext(this);
		this.user.setCourseStatus(courseId, state);
		// this.courseId = courseId;
	}

	getState() {
		return this.state;
	}
}
