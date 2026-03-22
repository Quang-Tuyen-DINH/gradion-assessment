import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = { findByEmail: jest.fn(), create: jest.fn() } as any;
    jwtService = { sign: jest.fn().mockReturnValue('token') } as any;
    service = new AuthService(usersService, jwtService);
  });

  it('should hash password on signup', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'user' } as any);
    await service.signup({ email: 'a@b.com', password: 'password123' });
    expect(usersService.create).toHaveBeenCalledWith(
      'a@b.com',
      expect.stringMatching(/^\$2b\$/),
      'user',
    );
  });

  it('should throw ConflictException if email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: '1' } as any);
    await expect(service.signup({ email: 'a@b.com', password: 'password123' }))
      .rejects.toThrow(ConflictException);
  });

  it('should return accessToken on valid login', async () => {
    const hash = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: hash, role: 'user' } as any);
    const result = await service.login({ email: 'a@b.com', password: 'password123' });
    expect(result.accessToken).toBe('token');
  });

  it('should throw UnauthorizedException if user not found on login', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'a@b.com', password: 'password123' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is wrong', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: hash, role: 'user' } as any);
    await expect(service.login({ email: 'a@b.com', password: 'wrongpassword' }))
      .rejects.toThrow(UnauthorizedException);
  });
});
