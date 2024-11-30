import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
        return
        // throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
        // return
        // throw new NotFoundException('User not found');
    }
    return user
  }
}