import {ConfigModule, ConfigService} from "@nestjs/config";
import {JwtModuleAsyncOptions} from "@nestjs/jwt";

export const getJWTConfig = (): JwtModuleAsyncOptions => {
  return {
    useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET')
    }),
    inject: [ConfigService],
    imports: [ConfigModule]
  }
}
