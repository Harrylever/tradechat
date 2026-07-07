import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 5000, description: 'Amount in Naira to withdraw' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amountNaira: number;
}

export class SaveBankAccountDto {
  @ApiProperty({
    example: '058',
    description: 'Bank code (e.g., GTBank is 058)',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({
    example: '0123456789',
    description: '10-digit NUBAN account number',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    example: 'ALHAJI ADEBOKE',
    description: 'Account holder name',
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}
