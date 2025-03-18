import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user: User | null;
    }
  }
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null; // No token provided
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify JWT
      const decoded = this.jwtService.verify(token);

      // Fetch user from DB
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });
      req.user = user || null;
    } catch (error) {
      // Token expired or invalid
      // req.user = null;
      return res
        .status(401)
        .json({ message: 'Token expired. Please log in again.' });
    }

    next();
  }
}
