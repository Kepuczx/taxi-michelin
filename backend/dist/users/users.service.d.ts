import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(userData: Partial<User>): Promise<User>;
    update(id: number, userData: Partial<User>): Promise<User>;
    updateUser(id: string, updateData: {
        email?: string;
        password?: string;
    }): Promise<{
        message: string;
    }>;
    remove(id: number): Promise<void>;
}
