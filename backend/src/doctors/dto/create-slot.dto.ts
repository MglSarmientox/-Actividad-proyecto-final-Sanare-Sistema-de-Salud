import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSlotDto {
  @ApiProperty({ example: '2026-09-15T14:00:00.000Z', description: 'ISO datetime de inicio (UTC)' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '2026-09-15T14:20:00.000Z', description: 'ISO datetime de fin (UTC)' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;
}