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
  Put,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { RoleGuard } from 'guards/role.guard';
import { Role } from 'decorators/role.decorator';
import { Category, PerchTypes, ReviewAction, Roles, UserType } from 'enums';

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
    @Query('limit') limit: number = 10,
    @Query('cursor') cursor: number,
    @Query('category') category: Category,
    @Query('from') from: UserType,
    @Query('perchType') perchType: PerchTypes,
    @Query('searchTerm') searchTerm: string,
    @Request() req,
  ) {
    const filter = {
      limit,
      category,
      from,
      perchType:
        perchType !== ('All' as unknown as PerchTypes) ? perchType : undefined,
      searchTerm: searchTerm,
    };
    const loggedInUserId = req.userId;
    return this.propertyService.findAll(filter, loggedInUserId, cursor);
  }

  @Post('review/:id')
  @UseGuards(RoleGuard)
  @Role(Roles.ADMIN)
  reviewAction(
    @Param('id') id: number,
    @Query('action') action: ReviewAction,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    return this.propertyService.review(id, action, loggedInUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
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
