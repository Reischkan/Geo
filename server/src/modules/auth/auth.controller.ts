import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // SEC-04: Strict rate limit on login — 5 attempts per 60 seconds to prevent brute-force
    @Public()
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Get('me')
    getMe(@Request() req: any) {
        return this.authService.getMe(req.user.userId);
    }
}
