import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, User } from '../entities';
import {
  NotificationController,
  NotificationMessagePatternController,
} from '../controllers';
import { JwtStrategy, CustomNamingStrategy } from '../strategies';
import {
  UserService,
  RabbitmqService,
  NotificationService,
} from 'src/services';
import {
  AllExceptionFilter,
  HttpExceptionFilter,
  ObjectExceptionFilter,
  QueryExceptionFilter,
  RpcExceptionFilter,
} from 'src/filters';

@Module({
  imports: [
    ClientsModule.register([]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: +process.env.DATABASE_PORT,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        namingStrategy: new CustomNamingStrategy(),
        entities: [User, Notification],
        synchronize: process.env.NODE_ENV === 'development',
      }),
    }),
    TypeOrmModule.forFeature([User, Notification]),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  controllers: [NotificationController, NotificationMessagePatternController],
  providers: [
    UserService,
    JwtStrategy,
    RabbitmqService,
    NotificationService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_FILTER, useClass: ObjectExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: RpcExceptionFilter },
    { provide: APP_FILTER, useClass: QueryExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
