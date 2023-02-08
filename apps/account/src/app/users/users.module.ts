import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {User, UserSchema} from "./models/user.model";
import {MongooseModule} from "@nestjs/mongoose";
import {UserRepository} from "./repositories/user.repository";

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }
  ])],
  providers: [UserRepository],
  exports: [UserRepository]
})
export class UsersModule {}
