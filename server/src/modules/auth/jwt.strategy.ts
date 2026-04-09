import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
    sub: string;      // userId
    email: string;
    role: string;
    tenantId: string;
    technicianId?: string;
}

// SEC-01: Read JWT secret from environment variable consistently
const JWT_SECRET = process.env.JWT_SECRET || 'geofield-dev-secret-change-in-prod';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            technicianId: payload.technicianId || '',
        };
    }
}
