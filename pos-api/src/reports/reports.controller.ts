import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Query('range') range?: 'today' | 'week' | 'month') {
    return this.reports.getDashboard(range ?? 'week');
  }

  @Get('sales')
  getSales(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month',
  ) {
    return this.reports.getSalesSummary(from, to, groupBy);
  }

  @Get('categories')
  getCategories() {
    return this.reports.getCategoryRevenue();
  }
}
