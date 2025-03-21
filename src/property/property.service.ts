import { HttpStatus, Injectable } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { handleError } from 'utils/helper-methods';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from 'rdbms/entities/Property.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'interfaces';
import { ResponseStatus } from 'enums';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, loggedInUserId) {
    try {
      const model = this.propertyRepository.create({
        ...createPropertyDto,
        name: createPropertyDto.propertyName,
        type: createPropertyDto.propertyType,
        bed: createPropertyDto.beds,
        bathroom: createPropertyDto.bathrooms,
        termsAndConditions: createPropertyDto.txc,
        host: loggedInUserId,
      });

      const property = await this.propertyRepository.save(model);

      const payload: ApiResponse<Property> = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property created successfully',
        data: property,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async findAll(cursor?: number, limit: number = 10) {
    try {
      const queryBuilder = this.propertyRepository
        .createQueryBuilder('property')
        .orderBy('property.id', 'DESC')
        .take(limit);

      // Apply cursor condition if provided
      if (cursor) {
        queryBuilder.where('property.id < :cursor', { cursor });
      }

      const properties = await queryBuilder.getMany();

      // Get the next cursor (last record's ID)
      const nextCursor = properties.length
        ? properties[properties.length - 1].id
        : null;

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property fetch successful',
        data: properties,
        nextCursor, // Return nextCursor for the next batch
      };
    } catch (err) {
      handleError(err);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} property`;
  }

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
