 NestJS Best Practices - Agent Reference Guide

## 1. PROJECT STRUCTURE

### Module Organization
- Gunakan feature-based module structure
- Setiap module harus self-contained dengan: controller, service, entity/model,DTO, repository
- Struktur folder standar:
```
src/
├── modules/
│   ├── users/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── users.repository.ts
│   ├── auth/
│   └── products/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── interfaces/
├── config/
├── database/
└── main.ts
```

### Naming Conventions
- Files: `kebab-case.type.ts` (e.g., `user.controller.ts`, `auth.service.ts`)
- Classes: `PascalCase` dengan suffix (e.g., `UserController`, `AuthService`)
- Interfaces: `PascalCase` dengan prefix I (e.g., `IUser`, `IUserRepository`)
- Constants: `UPPER_SNAKE_CASE`
- Variables/Functions: `camelCase`

## 2. CONTROLLERS

### Structure Pattern
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Query() query: FindAllUsersDto): Promise {
    return this.userService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() createUserDto: CreateUserDto): Promise {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise {
    await this.userService.remove(id);
  }
}
```

### Controller Rules
- HANYA handle HTTP layer (request/response)
- TIDAK ada business logic di controller
- Gunakan DTOs untuk semua input
- Gunakan Pipes untuk validation dan transformation
- Return DTO atau Entity, bukan raw data
- Gunakan proper HTTP status codes dengan @HttpCode()
- Selalu tambahkan Swagger decorators (@ApiOperation, @ApiResponse, @ApiTags)

## 3. SERVICES

### Service Pattern
```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: FindAllUsersDto): Promise {
    const { page = 1, limit = 10, search } = query;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.where('user.name ILIKE :search', { search: `%${search}%` });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    
    this.eventEmitter.emit('user.created', savedUser);
    
    return savedUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise {
    const user = await this.findOne(id);
    
    Object.assign(user, updateUserDto);
    
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
```

### Service Rules
- Semua business logic ada di service
- Gunakan dependency injection via constructor
- Methods harus async jika melakukan I/O operations
- Throw exceptions untuk error cases, JANGAN return null/undefined
- Gunakan transactions untuk operasi multi-step
- Extract complex logic ke private methods
- Single Responsibility Principle - satu service satu domain

## 4. DTOs (Data Transfer Objects)

### DTO Pattern
```typescript
// create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

// update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const)
) {}

// user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  phone?: string;

  @Exclude()
  password: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
```

### DTO Rules
- Buat DTO terpisah untuk: Create, Update, Response, Query
- Gunakan class-validator decorators untuk validation
- Gunakan class-transformer untuk data transformation
- Gunakan @Transform() untuk sanitize input
- Response DTO harus @Exclude() sensitive data (password, tokens)
- Gunakan PartialType, PickType, OmitType dari @nestjs/swagger untuk reuse
- Tambahkan @ApiProperty() untuk Swagger documentation

## 5. ENTITIES

### Entity Pattern (TypeORM)
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
```

### Entity Rules
- Gunakan decorators TypeORM/Mongoose sesuai database
- Tambahkan indexes pada columns yang sering di-query
- Set `select: false` untuk sensitive fields
- Gunakan lifecycle hooks (@BeforeInsert, @BeforeUpdate) untuk transformations
- Definisikan relationships dengan proper decorators (@OneToMany, @ManyToOne, dll)

## 6. VALIDATION & PIPES

### Global Validation Setup
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Auto transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto type conversion
      },
    }),
  );
  
  await app.listen(3000);
}
```

### Custom Pipe Example
```typescript
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException('Invalid ObjectId format');
    }
    return value;
  }
}
```

### Validation Rules
- Gunakan ValidationPipe globally di main.ts
- Set `whitelist: true` untuk security
- Gunakan custom pipes untuk complex transformations
- Built-in pipes: ParseIntPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe

## 7. EXCEPTION HANDLING

### Global Exception Filter
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message;
        
      errors = (exceptionResponse as any).errors;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
      'AllExceptionsFilter',
    );

    response.status(status).json(errorResponse);
  }
}
```

### Custom Exception
```typescript
export class UserNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super(`User with ID ${userId} not found`);
  }
}
```

### Exception Rules
- Gunakan built-in exceptions: NotFoundException, BadRequestException, ConflictException, UnauthorizedException, ForbiddenException
- Create custom exceptions yang extends built-in untuk specific cases
- JANGAN catch exceptions jika tidak perlu re-throw atau handle
- Log semua exceptions dengan proper context
- Return consistent error response format

## 8. GUARDS & AUTHORIZATION

### JWT Auth Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
```

### Roles Guard
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Custom decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Post()
@Roles('admin', 'moderator')
@UseGuards(JwtAuthGuard, RolesGuard)
async create() {}
```

### Guard Rules
- Guards untuk authentication & authorization ONLY
- Gunakan @UseGuards() di controller atau method level
- Bind guards globally di main.ts jika applicable
- Order matters: authentication guard sebelum authorization guard

## 9. INTERCEPTORS

### Logging Interceptor
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${delay}ms`,
          'HTTP',
        );
      }),
    );
  }
}
```

### Transform Interceptor
```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
    return next.handle().pipe(
      map(data => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### Interceptor Rules
- Gunakan untuk: logging, transformation, caching, timeout handling
- Bind globally atau per-route
- Gunakan RxJS operators (map, tap, catchError)

## 10. CONFIGURATION

### Config Module Setup
```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});

// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

### Usage in Service
```typescript
@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDatabaseConfig() {
    const host = this.configService.get('database.host');
    const port = this.configService.get('database.port');
    return { host, port };
  }
}
```

### Config Rules
- JANGAN hardcode values, gunakan environment variables
- Validate env variables dengan Joi schema
- Set isGlobal: true untuk ConfigModule
- Gunakan typed getters dengan ConfigService
- Group related config dalam namespaces

## 11. DATABASE PATTERNS

### Repository Pattern (TypeORM)
```typescript
@Injectable()
export class UserRepository extends Repository {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise {
    return this.createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .getMany();
  }

  async createUser(createUserDto: CreateUserDto): Promise {
    const user = this.create(createUserDto);
    return this.save(user);
  }
}
```

### Transaction Example
```typescript
@Injectable()
export class UserService {
  constructor(
    private dataSource: DataSource,
    private userRepository: UserRepository,
  ) {}

  async createUserWithProfile(
    createUserDto: CreateUserDto,
    profileDto: CreateProfileDto,
  ): Promise {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.save(User, createUserDto);
      const profile = await queryRunner.manager.save(Profile, {
        ...profileDto,
        userId: user.id,
      });

      await queryRunner.commitTransaction();
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Database Rules
- Gunakan repository pattern untuk data access
- Extract complex queries ke repository methods
- Gunakan QueryBuilder untuk dynamic queries
- ALWAYS use transactions untuk multi-step operations
- Add proper indexes di entity definitions
- Use eager/lazy loading appropriately
- JANGAN expose repository langsung di controller

## 12. TESTING

### Unit Test Example
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get<Repository>(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: 1, email: 'test@example.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(user as User);

      const result = await service.findOne(1);
      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

### E2E Test Example
```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
      });
  });
});
```

### Testing Rules
- Mock dependencies di unit tests
- Test business logic di services
- Test HTTP layer di e2e tests
- Test error cases dan edge cases
- Aim for >80% code coverage untuk services
- Isolate tests - jangan depend on test order

## 13. SECURITY

### Security Checklist
```typescript
// main.ts - Security Setup
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Helmet
  app.use(helmet());

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
```

### Security Rules
- ALWAYS validate dan sanitize input dengan DTOs
- Gunakan helmet untuk security headers
- Implement rate limiting
- Gunakan CORS properly
- Hash passwords dengan bcrypt (salt rounds >= 10)
- Gunakan JWT dengan proper expiration
- JANGAN expose stack traces di production
- Sanitize error messages yang dikirim ke client
- Use HTTPS di production
- Keep dependencies updated

## 14. LOGGING

### Logger Setup
```typescript
// logger.service.ts
@Injectable()
export class LoggerService extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // Send to external service (e.g., Sentry, LogRocket)
    super.error(message, stack, context);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
  }

  log(message: any, context?: string) {
    super.log(message, context);
  }
}

// Usage
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async findOne(id: number): Promise {
    this.logger.log(`Finding user with id: ${id}`, 'UserService');
    // ...
  }
}
```

### Logging Rules
- Gunakan built-in Logger atau custom logger service
- Log di level yang tepat: error, warn, log, debug, verbose
- Include context (service name, method name)
- Log errors dengan stack trace
- JANGAN log sensitive data (passwords, tokens)
- Use structured logging di production

## 15. SWAGGER DOCUMENTATION

### Swagger Setup
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
```

### Swagger Decorators
```typescript
@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise {
    return this.userService.create(createUserDto);
  }
}
```

## 16. PERFORMANCE

### Performance Tips
- Gunakan database indexes untuk frequently queried columns
- Implement caching dengan @nestjs/cache-manager
- Use pagination untuk list endpoints
- Lazy load modules yang tidak selalu dipakai
- Enable compression
- Use select specific columns, jangan select *
- Implement database connection pooling
- Use Redis untuk session/cache storage
- Profile dan monitor performance (APM tools)

### Caching Example
```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private userRepository: UserRepository,
  ) {}

  async findOne(id: number): Promise {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findOne({ where: { id } });
    await this.cacheManager.set(cacheKey, user, 3600); // 1 hour TTL

    return user;
  }
}
```

## CRITICAL RULES - MUST FOLLOW

1. **NEVER put business logic in controllers** - Controllers are HTTP layer only
2. **ALWAYS use DTOs for input validation** - Never trust raw request data
3. **ALWAYS throw exceptions for errors** - Don't return error objects
4. **ALWAYS use async/await** - No callbacks in NestJS
5. **ALWAYS use dependency injection** - Constructor injection preferred
6. **ALWAYS validate environment variables** - Use Joi schema
7. **ALWAYS use transactions for multi-step DB operations**
8. **NEVER expose sensitive data in responses** - Use @Exclude() in DTOs
9. **ALWAYS add proper error handling** - Use exception filters
10. **ALWAYS add Swagger documentation** - Use decorators

## CODE GENERATION PRIORITY

When generating code:
1. Start with module structure (module, controller, service, entity, DTOs)
2. Add proper typing everywhere (no `any` types)
3. Add validation decorators in DTOs
4. Add error handling
5. Add Swagger documentation
6. Add proper logging
7. Follow naming conventions strictly
8. Write clean, readable code with proper spacing