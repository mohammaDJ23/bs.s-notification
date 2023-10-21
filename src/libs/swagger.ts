import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function swagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Notification apis')
    .setDescription('The apis of the notification service')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('notification', app, document);
}
