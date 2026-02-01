import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const result = await this.authService.login(loginDto);

    // Log Audit
    if (result.user) {
      // Use connect for relation if userId scalar is not allowed directly in CreateInput
      await this.auditLogsService.create({
        user: { connect: { id: result.user.id } },
        actionType: 'LOGIN',
        targetTable: 'users',
        targetId: result.user.id.toString(),
        oldValue: undefined,
        newValue: { status: 'SUCCESS' },
        ipAddress: ip,
      });
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.userId as number;
    return this.authService.getMe(userId);
  }
}
