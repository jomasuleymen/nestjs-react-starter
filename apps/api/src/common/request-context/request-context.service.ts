import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RequestContext, RequestUser } from './request-context.types';

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService<RequestContext>) {}

  getContext(): RequestContext {
    return this.cls.get();
  }

  getUser(): RequestUser | undefined {
    return this.cls.get('user');
  }

  setUser(user: RequestUser): void {
    this.cls.set('user', user);
  }

  getClientIp(): string | undefined {
    return this.cls.get('clientIp');
  }

  setClientIp(clientIp: string | undefined): void {
    this.cls.set('clientIp', clientIp);
  }
}
