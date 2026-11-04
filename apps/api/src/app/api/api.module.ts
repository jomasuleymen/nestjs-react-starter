import { RequestContextModule } from '@common/request-context';
import { InfrastructureModule } from '@infra/infrastructure.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FilesModule } from '@modules/files/files.module';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import ms from 'ms';
import { ClsModule } from 'nestjs-cls';
import { RequestContextInterceptor } from './context/request-context.interceptor';
import { ApiExceptionFilter } from './errors/api-exception.filter';

@Module({
  imports: [
    InfrastructureModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        resolveProxyProviders: true,
      },
    }),
    RequestContextModule,
    ThrottlerModule.forRoot([
      {
        ttl: ms('1m'),
        limit: 360,
      },
    ]),
    AuthModule,
    FilesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiModule {}
