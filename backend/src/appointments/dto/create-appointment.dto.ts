import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'cl0s9f...slot-id', description: 'ID del slot a reservar' })
  @IsNotEmpty()
  @IsString()
  slotId: string;

  @ApiPropertyOptional({ example: 'Dolor de cabeza recurrente', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class ListAppointmentsQueryDto {
  @ApiPropertyOptional({ description: 'Estado: CONFIRMED | CANCELLED | COMPLETED | NO_SHOW' })
  @IsOptional()
  @IsString()
  status?: string;
}