import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { map, Observable } from 'rxjs';
import { MessageDto, NotificationQuantitiesDto } from 'src/dtos';
import { NotificationDto } from 'src/dtos/notification.dto';
import { ClassConstructor } from 'src/types';

export class ObjectSerializerInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(
    context: ExecutionContext,
    handler: CallHandler,
  ): Observable<object> {
    return handler.handle().pipe(
      map((data: object) => {
        return this.plainToClass(data);
      }),
    );
  }

  plainToClass(data: object) {
    return plainToClass(this.dto, data, {
      excludeExtraneousValues: true,
    });
  }
}

export class MessageSerializerInterceptor extends ObjectSerializerInterceptor {
  constructor() {
    super(MessageDto);
  }
}

export class NotificationSerializerInterceptor extends ObjectSerializerInterceptor {
  constructor() {
    super(NotificationDto);
  }
}

export class NotificationQuantitiesSerializerInterceptor extends ObjectSerializerInterceptor {
  constructor() {
    super(NotificationQuantitiesDto);
  }
}
