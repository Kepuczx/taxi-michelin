import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    // Sprawdź czy email już istnieje
    const existingUser = await this.usersRepository.findOneBy({ 
      email: userData.email 
    });
    if (existingUser) {
      throw new Error('Użytkownik z tym emailem już istnieje');
    }

    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }

async update(id: any, userData: Partial<User>): Promise<User> {
  await this.usersRepository.update(id, userData);
  return this.findOne(id);
}

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
  }
  

}