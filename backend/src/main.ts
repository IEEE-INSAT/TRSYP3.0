import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const allowedOrigins = new Set(
        [
            'http://localhost:3000',
            'https://rtc.ieee.tn',
            'https://trsyp.ieee.tn',
            process.env.FRONTEND_URL,
            ...(process.env.CORS_ORIGINS?.split(',') ?? []),
        ]
            .filter((origin): origin is string => Boolean(origin))
            .map((origin) => origin.replace(/\/$/, '')),
    );

    // The request path is: client → Cloudflare → Render proxy → app, so
    // X-Forwarded-For carries 3 hops (client, CF, Render). Trust 3 hops from the
    // server side so req.ip resolves to the real client (the left-most XFF entry)
    // instead of Render's internal 10.x address — otherwise ThrottlerGuard would
    // rate-limit every user as if they were one client.
    app.set('trust proxy', 3);

    // Security headers — sets X-Content-Type-Options, Strict-Transport-Security,
    // X-Frame-Options, X-XSS-Protection, Referrer-Policy, and more.
    app.use(helmet());

    // CORS — allow the frontend origin (from env) to call the backend.
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
                callback(null, true);
                return;
            }
            callback(new Error(`CORS blocked origin: ${origin}`));
        },
        credentials: true,
    });

    // Swagger — only expose API docs in non-production environments.
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('TRSYP 3.0 API')
            .setDescription('Backend API for TRSYP 3.0')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                'JWT-auth',
            )
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(
        process.env.PORT ? Number(process.env.PORT) : 3001,
        '0.0.0.0',
    );
}
bootstrap();
