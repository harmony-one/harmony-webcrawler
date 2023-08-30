import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ParseDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  password?: string;
}
