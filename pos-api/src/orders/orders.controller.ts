import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  findAll(@Query() query: PaginationDto & { status?: string; from?: string; to?: string }) {
    return this.orders.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser('sub') cashierId: string) {
    return this.orders.create(dto, cashierId);
  }

  @Patch(':id/void')
  @Roles('ADMIN', 'MANAGER')
  voidOrder(@Param('id') id: string) {
    return this.orders.voidOrder(id);
  }
}
