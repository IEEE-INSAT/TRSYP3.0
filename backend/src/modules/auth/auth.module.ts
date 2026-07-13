import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthService } from "./service/auth.service";
import { SupabaseJwtStrategy } from "./supabase-jwt.strategy";
import { AuthController } from "./controller/auth.controller";
import { EmailModule } from '../email/email.module';



@Module({
    imports: [PrismaModule,PassportModule,JwtModule, EmailModule],
    controllers: [AuthController],
    providers: [AuthService,SupabaseJwtStrategy],
    exports: [AuthService]
})
export class AuthModule { }
