import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
      },
      include: {
        role: true,
        branch: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        role: true,
        branch: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findByBranch(branchId: number) {
    return this.prisma.user.findMany({
      where: { branchId },
      include: {
        role: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...userData } = updateUserDto;

    // Create updateData properly typed as Prisma.UserUpdateInput
    const updateData: Prisma.UserUpdateInput = { ...userData };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        branch: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
