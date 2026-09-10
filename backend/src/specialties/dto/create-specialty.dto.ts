import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiología' })
  @IsString()
  @Length(3, 60, { message: 'El nombre debe tener entre 3 y 60 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Atención del corazón y el sistema circulatorio' })
  @IsOptional()
  @IsString()
  @Length(5, 300)
  description?: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'El color debe ser un HEX válido (ej: #ef4444)',
  })
  color?: string;
}