import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthService } from "./service/auth.service";
import { SupabaseJwtStrategy } from "./supabase-jwt.strategy";
import { AuthController } from "./controller/auth.controller";



@Module({
    imports: [PrismaModule,PassportModule,JwtModule],
    controllers: [AuthController],
    providers: [AuthService,SupabaseJwtStrategy],
    exports: [AuthService]
})
export class AuthModule { }
