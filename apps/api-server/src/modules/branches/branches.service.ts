import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.branch.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateBranchDto: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async updateStatus(id: number, isActive: boolean) {
    return this.prisma.branch.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: number) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
