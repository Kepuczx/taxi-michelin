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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findAll() {
        return this.usersRepository.find();
    }
    async findOne(id) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new common_1.NotFoundException(`Użytkownik o id ${id} nie istnieje`);
        }
        return user;
    }
    async create(userData) {
        const existingUser = await this.usersRepository.findOneBy({
            email: userData.email,
        });
        if (existingUser)
            throw new Error('Użytkownik z tym emailem już istnieje');
        const newUser = this.usersRepository.create(userData);
        return this.usersRepository.save(newUser);
    }
    async update(id, userData) {
        await this.usersRepository.update(id, userData);
        return this.findOne(id);
    }
    async updateUser(id, updateData) {
        const user = await this.usersRepository.findOneBy({ id: +id });
        if (!user) {
            throw new common_1.NotFoundException(`Użytkownik o id ${id} nie istnieje`);
        }
        const dataToUpdate = {};
        if (updateData.email) {
            dataToUpdate.email = updateData.email;
        }
        if (updateData.password && updateData.password.trim() !== '') {
            dataToUpdate.password = updateData.password;
        }
        await this.usersRepository.update(+id, dataToUpdate);
        return { message: 'Dane zapisane (plain text)' };
    }
    async remove(id) {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Użytkownik o id ${id} nie istnieje`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map