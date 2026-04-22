"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const driver_log_entity_1 = require("../users/driver-log.entity");
let AuthService = class AuthService {
    userRepository;
    driverLogRepository;
    jwtService;
    constructor(userRepository, driverLogRepository, jwtService) {
        this.userRepository = userRepository;
        this.driverLogRepository = driverLogRepository;
        this.jwtService = jwtService;
    }
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email }
        });
        if (user && user.password && user.password === loginDto.password) {
            if (user.role === 'driver') {
                const log = this.driverLogRepository.create({
                    driverId: user.id,
                    eventType: 'logowanie',
                    eventTime: new Date(),
                    description: `Zalogowano do systemu`,
                    changedBy: user.email,
                    ipAddress: ipAddress,
                    userAgent: userAgent
                });
                await this.driverLogRepository.save(log);
            }
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            return {
                access_token: this.jwtService.sign(payload),
                role: user.role,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                message: `Witaj ${user.firstName}! Zalogowano pomyślnie jako ${user.role}.`,
            };
        }
        throw new common_1.UnauthorizedException('Nieprawidłowy email lub hasło');
    }
    async logout(userId, ipAddress, userAgent) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && user.role === 'driver') {
            const log = this.driverLogRepository.create({
                driverId: user.id,
                eventType: 'wylogowanie',
                eventTime: new Date(),
                description: `Wylogowano z systemu`,
                changedBy: user.email,
                ipAddress: ipAddress,
                userAgent: userAgent
            });
            await this.driverLogRepository.save(log);
        }
        return { message: 'Wylogowano pomyślnie' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(driver_log_entity_1.DriverLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map