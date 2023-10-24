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
  Get,
  Query,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request as Req } from 'express';
import { CurrentUser, Roles } from 'src/decorators';
import {
  ErrorDto,
  MessageDto,
  NotificationListFiltersDto,
  SubscribeDto,
  UnsubscribeDto,
} from 'src/dtos';
import { NotificationDto } from 'src/dtos/notification.dto';
import { User, Notification } from 'src/entities';
import { JwtGuard, RolesGuard } from 'src/guards';
import {
  MessageSerializerInterceptor,
  NotificationSerializerInterceptor,
  NotificationsSerializerInterceptor,
} from 'src/interceptors';
import { ParseNotificationListFiltersPipe } from 'src/pipes';
import { NotificationService } from 'src/services';
import { UserRoles } from 'src/types';

@UseGuards(JwtGuard)
@Controller('/api/v1/notification')
@ApiTags('/api/v1/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(MessageSerializerInterceptor)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.CREATED, type: MessageDto })
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

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER)
  @UseGuards(RolesGuard)
  @UseInterceptors(NotificationsSerializerInterceptor)
  @ApiQuery({ name: 'page', type: 'number' })
  @ApiQuery({ name: 'take', type: 'number' })
  @ApiQuery({ name: 'filters', type: NotificationListFiltersDto })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: NotificationDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('filters', ParseNotificationListFiltersPipe)
    filters: NotificationListFiltersDto,
  ): Promise<[Notification[], number]> {
    return this.notificationService.findAll(page, take, filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.OWNER)
  @UseGuards(RolesGuard)
  @UseInterceptors(NotificationSerializerInterceptor)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, type: NotificationDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
  findByIdOrFail(@Param('id', ParseIntPipe) id: number): Promise<Notification> {
    return this.notificationService.findByIdOrFail(id);
  }
}
