import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: number;
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isRead') isRead?: string,
  ) {
    const userId = req.user.userId;
    const isReadBool =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    console.log(
      `[Notifications] findAll params: userId=${userId}, isRead=${isRead}, isReadBool=${isReadBool}, skip=${skip}, take=${take}`,
    );

    return this.notificationsService.findAll(
      userId,
      skip ? Number(skip) : 0,
      take ? Number(take) : 20,
      isReadBool,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return { count: await this.notificationsService.getUnreadCount(userId) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
