import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import {
  getFilteredPropertyMedia,
  getStatusFromAction,
  handleError,
} from 'utils/helper-methods';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from 'rdbms/entities/Property.entity';
import { Repository } from 'typeorm';
import { ApiResponse, Filter } from 'interfaces';
import {
  Category,
  MediaEntityType,
  MediaUploadType,
  RegistrationStatus,
  ResponseStatus,
  ReviewAction,
  UserType,
} from 'enums';
import { GlobalUtilService } from 'src/global-utils';
import { propertyMediaTypes } from 'utils/constants';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly globalUtilService: GlobalUtilService,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, loggedInUserId) {
    try {
      // Create a new property entity with the correct property names
      const propertyData = {
        name: createPropertyDto.propertyName,
        type: createPropertyDto.propertyType,
        bed: createPropertyDto.beds,
        bathroom: createPropertyDto.bathrooms,
        checkInPeriods: createPropertyDto.checkInTimes,
        checkOutPeriod: createPropertyDto.checkOutTime,
        termsAndConditions: createPropertyDto.txc,
        host: loggedInUserId,
        description: createPropertyDto.description,
        price: createPropertyDto.price,
        cautionFee: createPropertyDto.cautionFee,
        header: createPropertyDto.header,
        chargeType: createPropertyDto.chargeType,
        facilities: createPropertyDto.facilities,
        location: {
          latitude: createPropertyDto.latitude,
          longitude: createPropertyDto.longitude,
          address: `${createPropertyDto.streetAddress}, ${createPropertyDto.city}, ${createPropertyDto.state}. ${createPropertyDto.country}`,
          streetAddress: createPropertyDto.streetAddress,
          propertyNumber: createPropertyDto.propertyNumber,
          city: createPropertyDto.city,
          state: createPropertyDto.state,
          country: createPropertyDto.country,
          snapshotUrl: createPropertyDto.snapshot,
        },
      };

      const model = this.propertyRepository.create(propertyData);
      const property = await this.propertyRepository.save(model);

      const payload: ApiResponse<Property> = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property created successfully',
        data: property,
      };
      return payload;
    } catch (err) {
      console.log('err', err);
      handleError(err);
    }
  }

  async findAll(filter: Filter, userId: number, cursor?: number) {
    const { limit, category, from, perchType, searchTerm } = filter;
    try {
      const queryBuilder = this.propertyRepository
        .createQueryBuilder('property')
        .orderBy('property.id', 'DESC')
        .innerJoinAndSelect('property.location', 'location')
        .take(limit);

      if (category) {
        queryBuilder.andWhere('property.category = :category', { category });
      }

      if (perchType) {
        queryBuilder.andWhere('property.type = :perchType', { perchType });
      }

      if (searchTerm) {
        queryBuilder.andWhere(
          '(property.name ILIKE :searchTerm OR property.location.streetAddress ILIKE :searchTerm)',
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
      console.log('err', err);
      handleError(err);
    }
  }

  async findOne(id: number) {
    try {
      const queryBuilder = this.propertyRepository
        .createQueryBuilder('property')
        .where('property.id = :id', { id })
        .innerJoinAndSelect('property.location', 'location')
        .innerJoinAndSelect('property.host', 'host');

      const property = await queryBuilder.getOne();

      if (!property)
        throw new HttpException(
          'Property does not exist',
          HttpStatus.BAD_REQUEST,
        );

      //get media uploads for property
      const mediaUploads = await this.globalUtilService.getMediaUploads(
        property.id,
        MediaEntityType.PROPERTY,
        property.host.id,
        propertyMediaTypes,
      );

      property['gallery'] = mediaUploads?.gallery ?? [];
      property['proofOfIdentity'] = mediaUploads?.proofOfIdentity ?? [];
      property['proofOfOwnership'] = mediaUploads?.proofOfOwnership ?? [];

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Property fetch successful',
        data: property,
      };
    } catch (err) {
      console.log('err', err);
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
