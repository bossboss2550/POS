import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const productImageDir = join(process.cwd(), 'storage', 'products');
mkdirSync(productImageDir, { recursive: true });

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  findAll(@Query() query: PaginationDto & { categoryId?: string; lowStock?: string }) {
    return this.products.findAll({ ...query, lowStock: query.lowStock === 'true' });
  }

  @Get('categories')
  getCategories() {
    return this.products.getCategories();
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.products.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Post('images')
  @Roles('ADMIN', 'MANAGER')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: productImageDir,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        console.log('File interceptor - checking mimetype:', file.mimetype);
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        // Simplify to just check existence, then we can tighten.
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: true, errorHttpStatusCode: 400 }),
    )
    file: any,
  ) {
    console.log('Received file object:', file);
    return { imageUrl: `/uploads/products/${file.filename}` };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}

