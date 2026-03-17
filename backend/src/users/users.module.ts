import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // rejestrujemy encję
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // przyda się później do auth
})
export class UsersModule {}