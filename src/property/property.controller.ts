import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { Category, PerchTypes, UserType } from 'enums';

@UseGuards(JwtAuthGuard)
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    const loggedInUserId = req.userId;
    return this.propertyService.create(createPropertyDto, loggedInUserId);
  }

  @Get()
  findAll(
    @Query('location') location: string,
    @Query('type') type: PerchTypes,
    @Query('limit') limit: number = 10,
    @Query('cursor') cursor: number,
    @Query('category') category: Category,
    @Query('from') from: UserType,
    @Query('perchType') perchType: PerchTypes,
    @Query('searchTerm') searchTerm: string,
    @Request() req,
  ) {
    const filter = {
      location,
      type,
      limit,
      category,
      from,
      perchType:
        perchType !== ('All' as unknown as PerchTypes) ? perchType : undefined,
      searchTerm: searchTerm,
    };
    console.log('filter', filter);
    const loggedInUserId = req.userId;
    return this.propertyService.findAll(filter, loggedInUserId, cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.propertyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(+id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertyService.remove(+id);
  }
}
