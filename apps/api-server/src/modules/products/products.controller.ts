import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: { user: { branchId: number } }) {
    const branchId = req.user.branchId;
    return this.productsService.findAll(branchId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Put(':id/price')
  @UseGuards(JwtAuthGuard)
  async updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductPriceDto: UpdateProductPriceDto,
    // @Request() req, // access user from request if needed
  ) {
    // const userId = req.user.id;
    const userId = 1; // Mock user ID for now
    return this.productsService.updatePrice(id, updateProductPriceDto, userId);
  }

  @Get(':id/price-history')
  @UseGuards(JwtAuthGuard)
  async getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getPriceHistory(id);
  }
}
