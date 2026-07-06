import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TwilioModule } from '../../twilio/twilio.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TwilioModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
    }),
    MerchantModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MagicLinkService, JwtStrategy],
  exports: [JwtModule, AuthService, MagicLinkService],
})
export class AuthModule {}
