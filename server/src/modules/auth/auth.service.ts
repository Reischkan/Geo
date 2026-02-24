import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        private jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user || !user.active) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });
        if (!tenant || !tenant.active) {
            throw new UnauthorizedException('Tenant desactivado');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };

        return {
            token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                logoUrl: tenant.logoUrl,
            },
        };
    }

    async getMe(userId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();
        const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });
        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug, logoUrl: tenant.logoUrl } : null,
        };
    }
}
