import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateSlotsDto {
  @ApiProperty({ example: '2026-09-14', description: 'Fecha de inicio (YYYY-MM-DD)' })
  daysFrom?: string;

  @ApiPropertyOptional({ example: 7, description: 'Cantidad de días a generar' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  days: number = 7;

  @ApiPropertyOptional({ example: 8, description: 'Hora de inicio (hora local, 24h)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number = 8;

  @ApiPropertyOptional({ example: 17, description: 'Hora de fin (hora local, 24h)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(23)
  endHour: number = 17;

  @ApiPropertyOptional({ example: 20, description: 'Duración de cada turno en minutos' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  slotDurationMinutes: number = 20;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5], description: 'Días de la semana (1=Lun..5=Vie)' })
  @IsOptional()
  @IsArray()
  weekdays?: number[];
}