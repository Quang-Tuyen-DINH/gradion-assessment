import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) { return this.auth.signup(dto); }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}
