import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/public.decorator';
import { Request as ExpressRequest } from 'express';
import { Public } from './decorators/public.decorator';
import {  
  UnauthorizedException
} from '@nestjs/common';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Roles()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Roles()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: RequestWithUser) {
    const user = await this.authService.getCurrentUser(req.user.id);
    console.log('Get current user:', user); // Add this log
    return user;
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(loginDto);
    console.log('Login result:', result); // Add this log
    return result;
  }

  @Roles()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() ResetPasswordDto: ResetPasswordDto
  ) {
    return await this.authService.resetPassword(ResetPasswordDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  // @Post('refresh-token')
  // @Public()
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(@Body('refreshToken') refreshToken: string) {
  //   return await this.authService.refreshToken(refreshToken);
  // }
}