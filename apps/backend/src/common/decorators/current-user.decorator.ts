import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// `sub` is the internal DB merchant id
export type JwtUser = { sub: string; whatsappNumber: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
    return req.user;
  },
);
