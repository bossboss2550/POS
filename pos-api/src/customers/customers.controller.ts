import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.customers.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customers.findOne(id);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.customers.getOrders(id, query);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }
}
