import { ValidationPipe } from '@nestjs/common';
import { ZodType } from 'zod';
import { CareerStage, COUNTRY, SB } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes';
import { RegisterLocalDto, RegisterLocalSchema } from './register-local.dto';
import { UpdateProfileDto, UpdateProfileSchema } from './update-profile.dto';

/**
 * main.ts installs ValidationPipe({ whitelist: true }) globally, which deletes
 * any body property without a class-validator decorator before the route's
 * Zod pipe runs. A field missing its decorator is dropped without an error,
 * so the request "succeeds" and changes nothing. Run both pipes, in order.
 */
async function throughPipes(metatype: new () => object, schema: ZodType, body: object) {
  const whitelisted = await new ValidationPipe({ whitelist: true, transform: true }).transform(body, {
    type: 'body',
    metatype,
  });
  return new ZodValidationPipe(schema).transform({ ...whitelisted });
}

describe('registration DTOs survive the global whitelist', () => {
  it('keeps every profile-edit field, including the ones that can be cleared', async () => {
    const body = {
      phone: '+21612345678',
      gender: 'female',
      careerStage: CareerStage.Student,
      country: COUNTRY.Tunisia,
      facebookLink: 'https://www.facebook.com/test.user',
      ieeeId: 12345678,
      sb: SB.INSAT,
    };
    await expect(throughPipes(UpdateProfileDto, UpdateProfileSchema, body)).resolves.toEqual(body);
  });

  it('keeps null, which removes the member number and branch', async () => {
    await expect(
      throughPipes(UpdateProfileDto, UpdateProfileSchema, { ieeeId: null, sb: null }),
    ).resolves.toEqual({ ieeeId: null, sb: null });
  });

  it('keeps every registration field', async () => {
    const body = {
      phone: '+21612345678',
      gender: 'male',
      careerStage: CareerStage.YoungProfessional,
      country: COUNTRY.Tunisia,
      facebookLink: 'https://www.facebook.com/test.user',
      ieeeId: 12345678,
      sb: SB.INSAT,
    };
    await expect(throughPipes(RegisterLocalDto, RegisterLocalSchema, body)).resolves.toEqual(body);
  });
});
