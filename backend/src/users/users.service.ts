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

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
    return user;
  }

  // Tworzenie użytkownika - hasło zapisywane "luzem"
  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.usersRepository.findOneBy({
      email: userData.email,
    });
    if (existingUser) throw new Error('Użytkownik z tym emailem już istnieje');

    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }

  // Zwykły update (dla starych metod Put)
  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  // --- NOWA PROSTA EDYCJA (BEZ BCRYPTA) ---
  async updateUser(
    id: string,
    updateData: { email?: string; password?: string },
  ) {
    const user = await this.usersRepository.findOneBy({ id: +id });
    if (!user) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }

    const dataToUpdate: Partial<User> = {};

    if (updateData.email) {
      dataToUpdate.email = updateData.email;
    }

    // Zapisujemy hasło dokładnie takie, jakie przyszło z modala
    if (updateData.password && updateData.password.trim() !== '') {
      dataToUpdate.password = updateData.password;
    }

    await this.usersRepository.update(+id, dataToUpdate);

    return { message: 'Dane zapisane (plain text)' };
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
  }
}
