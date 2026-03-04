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
    console.log('cookie: ', req.headers.cookie);

    console.log(req.session, 'req.json()');
    if (!req.session?.userId) {
      console.log('not logged INNNNNN');
      throw new UnauthorizedException('Not logged in');
    }
    return true;
  }
}
