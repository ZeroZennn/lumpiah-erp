import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: { username: string; password: string }) {
    // Find user by username and include role relation
    const user = await this.prisma.user.findUnique({
      where: { username: credentials.username },
      include: { role: true },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with payload
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return access token and user info
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role.name,
        branchId: user.branchId,
      },
    };
  }
}
