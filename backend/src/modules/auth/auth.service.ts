import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { 
  RegisterDto, 
  LoginDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  ChangePasswordDto 
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../shared/services/email.service';
import { CacheService } from '../shared/services/cache.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Create verification token
    const verificationToken = uuidv4();

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase(),
      passwordHash: hashedPassword,
      verificationToken,
      role: 'user'
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken
    );

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      message: 'Registration successful. Please verify your email.',
      ...tokens
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
      select: ['id', 'email', 'passwordHash', 'verificationStatus', 'role']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.verificationStatus !== 'verified') {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      message: 'Login successful',
      ...tokens
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token }
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.verificationStatus = 'verified';
    user.verificationToken = null;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email.toLowerCase() }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in cache
    await this.cacheService.set(
      `password_reset:${resetToken}`,
      user.id,
      60 * 60 * 24 // 24 hours
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    );

    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const userId = await this.cacheService.get(`password_reset:${resetPasswordDto.token}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    // Update password
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    // Remove reset token from cache
    await this.cacheService.delete(`password_reset:${resetPasswordDto.token}`);

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

    // Update password
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('app.jwt.refreshSecret')
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role
        },
        {
          secret: this.configService.get('app.jwt.secret'),
          expiresIn: this.configService.get('app.jwt.expiresIn')
        }
      ),
      this.jwtService.signAsync(
        {
          sub: user.id
        },
        {
          secret: this.configService.get('app.jwt.refreshSecret'),
          expiresIn: '7d'
        }
      )
    ]);

    return {
      accessToken,
      refreshToken
    };
  }
}