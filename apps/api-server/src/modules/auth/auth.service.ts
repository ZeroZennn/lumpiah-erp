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

  async login(credentials: { email: string; password: string }) {
    // Find user by email and include role relation
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        role: true,
        branch: true,
      },
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
      email: user.email,
      fullname: user.fullname,
      phoneNumber: user.phoneNumber,
      role: user.role.name,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return access token and user info
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
        role: user.role, // Return full role object
        branch: user.branch, // Return full branch object
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Exclude passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
