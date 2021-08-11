import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {}
