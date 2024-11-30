// backend/src/modules/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  NotFoundException,
  InternalServerErrorException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { compare, hash, genSalt } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../users/entities/user.entity';
import { EmailService } from '../shared/email/email.service';
import { CacheService } from '../shared/cache/cache.service';
import { 
  RegisterDto, 
  LoginDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  ChangePasswordDto 
} from './dto/auth.dto';
import { VerificationStatus } from '../users/enums/verification-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService
  ) {}

  async register(registerDto: RegisterDto) {
    
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const salt = await genSalt();
      const hashedPassword = await hash(registerDto.password, salt);

      // Create verification token
      const verificationToken = uuidv4();

      // Create user
      const user = this.userRepository.create({
        ...registerDto,
        email: registerDto.email.toLowerCase(),
        passwordHash: hashedPassword,
        verificationToken,
        role: 'user',
        verificationStatus: VerificationStatus.VERIFIED
      });

      await this.userRepository.save(user);

      // Send verification email
      // await this.emailService.sendVerificationEmail(
      //   user.email,
      //   user.firstName,
      //   verificationToken
      // );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        message: 'Registration successful. Please verify your email.',
        ...tokens
      };
    } catch (error : any) {
      console.error('Registration error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during registration: ' + error.message);
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log('Current user:', user); // Add this log
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      // Include other necessary user fields
    };
  }

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      console.log('User validated:', { id: user.id, email: user.email, role: user.role }); // Add this log
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email.toLowerCase() },
        select: ['id', 'email', 'passwordHash', 'verificationStatus', 'role']
      });
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isPasswordValid = await compare(loginDto.password, user.passwordHash);
  
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // if (user.verificationStatus !== 'verified') {
      //   throw new UnauthorizedException('Please verify your email first');
      // }
  
      const tokens = await this.generateTokens(user);
  
      console.log('Login successful for user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus
      });
  
      return {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          verificationStatus: user.verificationStatus
        },
        ...tokens
      };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during login: ' + error.message);
    }
  }
  

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token }
    });
  
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
  
    user.verificationStatus = VerificationStatus.VERIFIED;
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

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.cacheService.set(
      `password_reset:${resetToken}`,
      user.id,
      60 * 60 * 24
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    );

    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const userId = await this.cacheService.get<string>(`password_reset:${resetPasswordDto.token}`);
  
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const salt = await genSalt();
    const hashedPassword = await hash(resetPasswordDto.password, salt);
  
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);
  
    await this.cacheService.set(`password_reset:${resetPasswordDto.token}`, '', 0);
  
    return { message: 'Password reset successful' };
  }

  private async generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }  

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m')
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d')
      })
    ]);

    return {
      accessToken,
      refreshToken
    };
  }
}