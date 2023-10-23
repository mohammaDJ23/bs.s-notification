import {
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Body,
  Post,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as Req } from 'express';
import { parse } from 'platform';
import { CurrentUser } from 'src/decorators';
import { ErrorDto, MessageDto, SubscribeDto, UnsubscribeDto } from 'src/dtos';
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
  subscribe(
    @Body() body: SubscribeDto,
    @CurrentUser() user: User,
    @Request() request: Req,
  ): Promise<MessageDto> {
    return this.notificationService.subscribe(body, user, request);
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(MessageSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: MessageDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  unsubscibe(
    @Body() body: UnsubscribeDto,
    @CurrentUser() user: User,
  ): Promise<MessageDto> {
    return this.notificationService.unsubscribe(body, user);
  }
}
