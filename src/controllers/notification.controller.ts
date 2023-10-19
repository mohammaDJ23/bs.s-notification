import {
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Body,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, MessageDto, SubscribeDto } from 'src/dtos';
import { User } from 'src/entities';
import { JwtGuard } from 'src/guards';
import { MessageSerializerInterceptor } from 'src/interceptors';
import { NotificationService } from 'src/services';

@UseGuards(JwtGuard)
@Controller('/api/v1/notification')
@ApiTags('/api/v1/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(MessageSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: MessageDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  subscibe(
    @Body() body: SubscribeDto,
    @CurrentUser() user: User,
  ): Promise<MessageDto> {
    return this.notificationService.subscribe(body, user);
  }
}
