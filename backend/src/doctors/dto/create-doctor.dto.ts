import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Carlos' })
  @IsString()
  @Length(2, 60)
  firstName: string;

  @ApiProperty({ example: 'Rodríguez' })
  @IsString()
  @Length(2, 60)
  lastName: string;

  @ApiProperty({ example: 'cl0s9f...specialty-id' })
  @IsNotEmpty()
  @IsString()
  specialtyId: string;

  @ApiPropertyOptional({ example: 'MTR-98765' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Días de consulta (0=Lun ... 6=Dom)' })
  @IsOptional()
  @IsArray()
  consultationDays?: number[];

  @ApiPropertyOptional({ description: 'Email para crear su cuenta de usuario (DOCTOR)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contraseña de la cuenta del doctor' })
  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string;
}