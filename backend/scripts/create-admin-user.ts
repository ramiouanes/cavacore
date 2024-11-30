import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminService } from '../src/modules/admin/admin.service';
import { UserRole } from '../src/modules/auth/decorators/public.decorator';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  const adminUser = {
    email: 'admin@example.com',
    password: 'AdminPassword123!', // This will be hashed in the service
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    verificationStatus: 'verified'
  };

  try {
    const createdUser = await adminService.createUser(adminUser);
    console.log('Admin user created:', createdUser);
  } catch (error: any) {
    console.error('Error creating admin user:', error.message);
  }

  await app.close();
}

bootstrap();