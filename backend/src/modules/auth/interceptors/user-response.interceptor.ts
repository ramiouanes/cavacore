import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Remove sensitive fields
        if (data && typeof data === 'object') {
          const { passwordHash, verificationToken, ...rest } = data;
          return rest;
        }
        return data;
      }),
    );
  }
}
