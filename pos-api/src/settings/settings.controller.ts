import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @Patch()
  @Roles('ADMIN')
  update(@Body() data: Record<string, string>) {
    return this.settings.update(data);
  }
}
