import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();
    service = module.get(PrismaService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit calls $connect', async () => {
    const spy = jest.spyOn(service, '$connect').mockResolvedValue();
    await service.onModuleInit();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy calls $disconnect', async () => {
    const spy = jest.spyOn(service, '$disconnect').mockResolvedValue();
    await service.onModuleDestroy();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
