import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get()
  findAll(@Query() query: PaginationDto & { lowStock?: string }) {
    return this.inventory.findAll({ ...query, lowStock: query.lowStock === 'true' });
  }

  // Static route MUST come before :productId dynamic route
  @Get('movements')
  getAllMovements(@Query() query: PaginationDto) {
    return this.inventory.getAllMovements(query);
  }

  @Get(':productId/movements')
  getMovements(@Param('productId') productId: string, @Query() query: PaginationDto) {
    return this.inventory.getMovements(productId, query);
  }

  @Post(':productId/adjust')
  @Roles('ADMIN', 'MANAGER')
  adjust(@Param('productId') productId: string, @Body() dto: AdjustStockDto) {
    return this.inventory.adjust(productId, dto);
  }
}
