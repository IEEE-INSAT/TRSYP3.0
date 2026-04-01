import {Controller,Post,Body,UseGuards,Req,Res,HttpStatus, Get, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../service/auth.service";
import {SupabaseAuthGuard} from "../guards/supabase-auth.guard";
import {Response,Request} from "express";
import { SyncUserDto } from "../dto/sync-user.dto";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService:AuthService){}

    @Post('sync-user')
    @UseGuards(SupabaseAuthGuard)
    async syncUser(@Body() dto:SyncUserDto, @Res() res:Response,@Req() req:Request){
        const supabaseId=(req.user as any).sub;
        if(!supabaseId){
            throw new UnauthorizedException('User not found');
        }
        const user=await this.authService.syncUser(supabaseId,dto);
        return res.status(HttpStatus.OK).json(user);
    }

    @Get('me')
    @UseGuards(SupabaseAuthGuard)
    async getMe(@Req() req:Request, @Res() res:Response){
        const user=await this.authService.findbySupabaseId((req.user as any).sub);
        return res.status(HttpStatus.OK).json(user);
    }
}