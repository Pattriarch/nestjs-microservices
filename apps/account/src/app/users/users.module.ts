import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {User, UserSchema} from "./models/user.model";
import {MongooseModule} from "@nestjs/mongoose";
import {UserRepository} from "./repositories/user.repository";
import {UserCommands} from "./user.commands";
import {UserQueries} from "./user.queries";
import { UserEventEmitter } from "../user.event-emitter";

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }
  ])],
  providers: [UserRepository, UserEventEmitter, UsersService],
  controllers: [UserCommands, UserQueries],
  exports: [UserRepository]
})
export class UsersModule {}
