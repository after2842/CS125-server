import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    console.log('session guard called');
    const req = ctx.switchToHttp().getRequest<any>();
    console.log(req.session, 'req.json()');
    if (!req.session?.userId) throw new UnauthorizedException('Not logged in');
    return true;
  }
}
