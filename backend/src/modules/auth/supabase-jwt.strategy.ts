import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy,ExtractJwt} from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy,'supabase-jwt'){
    constructor(
        private readonly configService:ConfigService,
        private readonly prisma:PrismaService,
    ){
        const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('SUPABASE_JWT_SECRET is not defined in environment variables');
        }
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey:jwtSecret,
        });
    }
    async validate(payload:any){
        const user=await this.prisma.user.findUnique({
            where:{supabaseId:payload.sub},
        });
        if(!user){
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}