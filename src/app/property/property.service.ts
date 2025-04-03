import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { handleError } from 'utils/helper-methods';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from 'rdbms/entities/Property.entity';
import { Repository } from 'typeorm';
import { ApiResponse, Filter } from 'interfaces';
import {
  Category,
  RegistrationStatus,
  ResponseStatus,
  ReviewAction,
  UserType,
} from 'enums';

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
        checkInPeriods: createPropertyDto.checkInTimes,
        checkOutPeriod: createPropertyDto.checkOutTime,
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

  async findAll(filter: Filter, userId: number, cursor?: number) {
    const { limit, category, location, from, perchType, searchTerm } = filter;
    try {
      const queryBuilder = this.propertyRepository
        .createQueryBuilder('property')
        .orderBy('property.id', 'DESC')
        .take(limit);

      if (category) {
        queryBuilder.andWhere('property.category = :category', { category });
      }

      if (perchType) {
        queryBuilder.andWhere('property.type = :perchType', { perchType });
      }

      if (searchTerm) {
        queryBuilder.andWhere(
          '(property.name ILIKE :searchTerm OR property.location ILIKE :searchTerm)',
          {
            searchTerm: `%${searchTerm}%`,
          },
        );
      }

      //Apply user's owned properties if provided
      if (from === UserType.HOST) {
        queryBuilder
          .innerJoin('property.host', 'host')
          .andWhere('host.id = :userId', { userId });
      }

      if (from === UserType.GUEST) {
        queryBuilder
          .innerJoin('property.host', 'host')
          .andWhere('host.id != :userId', { userId });
      }

      if (from === UserType.ADMIN) {
        queryBuilder.andWhere('property.status = :status', {
          status: RegistrationStatus.IN_REVIEW,
        });
      }

      // Apply cursor condition if provided
      if (cursor) {
        queryBuilder.andWhere('property.id < :cursor', { cursor });
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

  async findOne(id: number) {
    try {
      const property = await this.propertyRepository.findOne({
        where: {
          id,
        },
        relations: ['host'],
      });

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property fetch successful',
        data: property,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async review(id: number, action: ReviewAction, userId: number) {
    try {
      if (!action || !id || !userId)
        throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);

      const property = await this.propertyRepository.findOne({
        where: { id },
        relations: ['host'],
      });

      if (!property)
        throw new HttpException(
          'Property does not exist',
          HttpStatus.BAD_REQUEST,
        );

      const status = getStatusFromAction(action);

      await this.propertyRepository.update(id, {
        status,
      });

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property reviewed successfully',
        data: null,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }

  async assignCategory(propertyId: string, category: Category) {
    await this.propertyRepository
      .createQueryBuilder()
      .update(Property)
      .set({ category }) // Assign category by ID
      .where('id = :propertyId', { propertyId })
      .execute();

    return { message: 'Category assigned successfully' };
  }

  async removeCategory(propertyId: string) {
    await this.propertyRepository
      .createQueryBuilder()
      .update(Property)
      .set({ category: null }) // Remove category reference
      .where('id = :propertyId', { propertyId })
      .execute();

    return { message: 'Category removed successfully' };
  }
}

function getStatusFromAction(action: ReviewAction) {
  switch (action) {
    case ReviewAction.APPROVE:
      return RegistrationStatus.APPROVED;
    case ReviewAction.REJECT:
      return RegistrationStatus.REJECTED;
  }
}
