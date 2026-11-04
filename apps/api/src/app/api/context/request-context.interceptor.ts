import { RequestContextService } from '@common/request-context';
import { AuthenticatedRequest } from '@modules/auth';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<AuthenticatedRequest>();

    this.requestContext.setClientIp(req.ip);

    if (req.user) {
      this.requestContext.setUser(req.user);
    }

    return next.handle();
  }
}
