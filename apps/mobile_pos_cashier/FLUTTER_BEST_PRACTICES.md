# Flutter Best Practices - Agent Reference Guide

## 1. PROJECT STRUCTURE

### Clean Architecture Structure
```
lib/
├── core/
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_strings.dart
│   │   ├── app_assets.dart
│   │   └── api_endpoints.dart
│   ├── errors/
│   │   ├── failures.dart
│   │   └── exceptions.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   └── network_info.dart
│   ├── utils/
│   │   ├── logger.dart
│   │   ├── validators.dart
│   │   └── extensions.dart
│   ├── themes/
│   │   ├── app_theme.dart
│   │   ├── light_theme.dart
│   │   └── dark_theme.dart
│   └── usecases/
│       └── usecase.dart
├── features/
│   ├── authentication/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   └── auth_local_datasource.dart
│   │   │   ├── models/
│   │   │   │   ├── user_model.dart
│   │   │   │   └── login_response_model.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       ├── logout_usecase.dart
│   │   │       └── get_current_user_usecase.dart
│   │   └── presentation/
│   │       ├── bloc/
│   │       │   ├── auth_bloc.dart
│   │       │   ├── auth_event.dart
│   │       │   └── auth_state.dart
│   │       ├── pages/
│   │       │   ├── login_page.dart
│   │       │   └── register_page.dart
│   │       └── widgets/
│   │           ├── login_form.dart
│   │           └── auth_button.dart
│   ├── home/
│   └── profile/
├── routes/
│   ├── app_router.dart
│   └── route_names.dart
├── di/
│   └── injection_container.dart
└── main.dart
```

### Feature-First Structure (Alternative - Simpler)
```
lib/
├── config/
│   ├── theme/
│   ├── routes/
│   └── constants/
├── shared/
│   ├── widgets/
│   ├── utils/
│   └── services/
├── features/
│   ├── auth/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── services/
│   ├── home/
│   └── profile/
└── main.dart
```

### Naming Conventions
- Files: `snake_case.dart` (e.g., `user_profile_page.dart`, `auth_service.dart`)
- Classes: `PascalCase` (e.g., `UserProfilePage`, `AuthService`)
- Variables/Functions: `camelCase` (e.g., `userName`, `getUserData()`)
- Constants: `lowerCamelCase` atau `SCREAMING_SNAKE_CASE` untuk compile-time constants
- Private members: `_leadingUnderscore`
- Widgets suffix: `Page`, `Screen`, `Widget`, `Dialog`, `BottomSheet`

## 2. STATE MANAGEMENT

### BLoC Pattern (Recommended for Complex Apps)

#### BLoC Setup
```dart
// auth_event.dart
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

class CheckAuthStatus extends AuthEvent {
  const CheckAuthStatus();
}

// auth_state.dart
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final User user;

  const AuthAuthenticated({required this.user});

  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;

  const AuthError({required this.message});

  @override
  List<Object?> get props => [message];
}

// auth_bloc.dart
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final LogoutUseCase logoutUseCase;
  final GetCurrentUserUseCase getCurrentUserUseCase;

  AuthBloc({
    required this.loginUseCase,
    required this.logoutUseCase,
    required this.getCurrentUserUseCase,
  }) : super(const AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await loginUseCase(
      LoginParams(
        email: event.email,
        password: event.password,
      ),
    );

    result.fold(
      (failure) => emit(AuthError(message: _mapFailureToMessage(failure))),
      (user) => emit(AuthAuthenticated(user: user)),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await logoutUseCase(NoParams());
    emit(const AuthUnauthenticated());
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    final result = await getCurrentUserUseCase(NoParams());

    result.fold(
      (failure) => emit(const AuthUnauthenticated()),
      (user) => emit(AuthAuthenticated(user: user)),
    );
  }

  String _mapFailureToMessage(Failure failure) {
    switch (failure.runtimeType) {
      case ServerFailure:
        return 'Server error occurred';
      case NetworkFailure:
        return 'Network connection failed';
      case AuthFailure:
        return 'Invalid credentials';
      default:
        return 'Unexpected error occurred';
    }
  }
}
```

#### BLoC Usage in Widget
```dart
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<AuthBloc>(),
      child: const LoginView(),
    );
  }
}

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLoginPressed() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
            LoginRequested(
              email: _emailController.text.trim(),
              password: _passwordController.text,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          } else if (state is AuthAuthenticated) {
            Navigator.of(context).pushReplacementNamed('/home');
          }
        },
        builder: (context, state) {
          if (state is AuthLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your email';
                      }
                      if (!value.contains('@')) {
                        return 'Please enter a valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      prefixIcon: Icon(Icons.lock),
                    ),
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      if (value.length < 6) {
                        return 'Password must be at least 6 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _onLoginPressed,
                      child: const Text('Login'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
```

### Provider Pattern (Alternative - Simpler)
```dart
// auth_provider.dart
class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider({required AuthService authService})
      : _authService = authService;

  Future<void> login(String email, String password) async {
    _setLoading(true);
    _errorMessage = null;

    try {
      _user = await _authService.login(email, password);
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _setLoading(true);

    try {
      await _authService.logout();
      _user = null;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

// Usage in main.dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(authService: AuthService()),
        ),
        // Other providers...
      ],
      child: const MyApp(),
    ),
  );
}

// Usage in widget
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return LoginForm(
            onLogin: (email, password) {
              authProvider.login(email, password);
            },
          );
        },
      ),
    );
  }
}
```

### State Management Rules
- **BLoC**: Use untuk complex state, multiple states, business logic heavy
- **Provider**: Use untuk simple to medium complexity
- **Riverpod**: Alternative modern ke Provider (recommended untuk new projects)
- **GetX**: Avoid untuk production apps (too much magic, hard to maintain)
- JANGAN mix state management solutions dalam satu feature
- SELALU dispose controllers, streams, dan listeners
- GUNAKAN const constructors dimana memungkinkan untuk performance

## 3. WIDGET BEST PRACTICES

### Widget Structure
```dart
// GOOD - Single Responsibility
class UserCard extends StatelessWidget {
  final User user;
  final VoidCallback onTap;

  const UserCard({
    super.key,
    required this.user,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: _buildAvatar(),
        title: Text(user.name),
        subtitle: Text(user.email),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: onTap,
      ),
    );
  }

  Widget _buildAvatar() {
    return CircleAvatar(
      backgroundImage: user.avatarUrl != null
          ? NetworkImage(user.avatarUrl!)
          : null,
      child: user.avatarUrl == null
          ? Text(user.name[0].toUpperCase())
          : null,
    );
  }
}

// BAD - Too much in build method
class UserList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: user.avatarUrl != null
                  ? NetworkImage(user.avatarUrl!)
                  : null,
              child: user.avatarUrl == null
                  ? Text(user.name[0].toUpperCase())
                  : null,
            ),
            title: Text(user.name),
            subtitle: Text(user.email),
            trailing: Icon(Icons.arrow_forward_ios),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => UserDetailPage(user: user),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
```

### Extracting Widgets
```dart
// Extract complex widgets ke separate classes
class ProductList extends StatelessWidget {
  final List<Product> products;

  const ProductList({super.key, required this.products});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: products.length,
      itemBuilder: (context, index) {
        return ProductCard(product: products[index]);
      },
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;

  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          _buildImage(),
          _buildTitle(),
          _buildPrice(),
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildImage() {
    return Image.network(
      product.imageUrl,
      height: 200,
      width: double.infinity,
      fit: BoxFit.cover,
    );
  }

  Widget _buildTitle() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        product.name,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildPrice() {
    return Text(
      '\$${product.price.toStringAsFixed(2)}',
      style: const TextStyle(
        fontSize: 16,
        color: Colors.green,
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        TextButton(
          onPressed: () {},
          child: const Text('View Details'),
        ),
        ElevatedButton(
          onPressed: () {},
          child: const Text('Add to Cart'),
        ),
      ],
    );
  }
}
```

### Widget Rules
- **GUNAKAN const constructors** dimana memungkinkan (performance boost)
- **Extract widgets** jika build method > 50 lines
- **Extract private methods** untuk complex widget trees (`_buildSomething()`)
- **JANGAN rebuild entire tree** - gunakan const dan extract widgets
- **StatelessWidget preferred** - gunakan StatefulWidget hanya jika butuh state
- **Key usage**: gunakan ValueKey/ObjectKey untuk list items yang bisa reorder
- **SELALU dispose** controllers di StatefulWidget

## 4. NAVIGATION & ROUTING

### Named Routes (Go Router Recommended)
```dart
// routes/app_router.dart
class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomePage(),
        routes: [
          GoRoute(
            path: 'profile',
            name: 'profile',
            builder: (context, state) => const ProfilePage(),
          ),
          GoRoute(
            path: 'settings',
            name: 'settings',
            builder: (context, state) => const SettingsPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/product/:id',
        name: 'product-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProductDetailPage(productId: id);
        },
      ),
    ],
    redirect: (context, state) {
      final authProvider = context.read<AuthProvider>();
      final isLoggedIn = authProvider.isAuthenticated;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !isGoingToLogin) {
        return '/login';
      }

      if (isLoggedIn && isGoingToLogin) {
        return '/home';
      }

      return null;
    },
  );
}

// main.dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: AppRouter.router,
      title: 'My App',
      theme: AppTheme.lightTheme,
    );
  }
}

// Navigation usage
// Simple navigation
context.go('/home');

// Named navigation
context.goNamed('product-detail', pathParameters: {'id': '123'});

// With query parameters
context.goNamed(
  'search',
  queryParameters: {'q': 'flutter', 'category': 'mobile'},
);

// Pop
context.pop();

// Replace
context.pushReplacement('/home');
```

### Navigation Rules
- **GUNAKAN go_router** untuk modern navigation (recommended)
- **Centralize routes** dalam satu file
- **Use named routes** - easier to manage
- **Handle deep linking** properly
- **Auth guards** via redirect callbacks
- **JANGAN use Navigator.push directly** - gunakan context.go/goNamed

## 5. API & NETWORKING

### Dio Setup
```dart
// core/network/dio_client.dart
class DioClient {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  DioClient({
    required Dio dio,
    required FlutterSecureStorage storage,
  })  : _dio = dio,
        _storage = storage {
    _dio
      ..options.baseUrl = ApiEndpoints.baseUrl
      ..options.connectTimeout = const Duration(seconds: 30)
      ..options.receiveTimeout = const Duration(seconds: 30)
      ..options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
      ..interceptors.addAll([
        AuthInterceptor(storage: _storage),
        LoggingInterceptor(),
        ErrorInterceptor(),
      ]);
  }

  // GET
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PUT
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException('Connection timeout');
      case DioExceptionType.badResponse:
        return _handleStatusCode(error.response?.statusCode ?? 0);
      case DioExceptionType.cancel:
        return CancelException('Request cancelled');
      default:
        return NetworkException('Network error occurred');
    }
  }

  Exception _handleStatusCode(int statusCode) {
    switch (statusCode) {
      case 400:
        return BadRequestException('Bad request');
      case 401:
        return UnauthorizedException('Unauthorized');
      case 403:
        return ForbiddenException('Forbidden');
      case 404:
        return NotFoundException('Not found');
      case 500:
      case 502:
      case 503:
        return ServerException('Server error');
      default:
        return UnknownException('Unknown error');
    }
  }
}

// Interceptors
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage storage;

  AuthInterceptor({required this.storage});

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await storage.read(key: 'auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Handle token refresh
      final refreshToken = await storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        try {
          // Attempt to refresh token
          // If successful, retry original request
          // If failed, logout user
        } catch (e) {
          // Logout user
        }
      }
    }
    handler.next(err);
  }
}

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('REQUEST[${options.method}] => PATH: ${options.path}');
    debugPrint('Headers: ${options.headers}');
    debugPrint('Data: ${options.data}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
    debugPrint('Data: ${response.data}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
    debugPrint('Message: ${err.message}');
    handler.next(err);
  }
}
```

### Data Source Implementation
```dart
// data/datasources/user_remote_datasource.dart
abstract class UserRemoteDataSource {
  Future<UserModel> login(String email, String password);
  Future<List<UserModel>> getUsers();
  Future<UserModel> getUserById(String id);
  Future<UserModel> updateUser(String id, Map<String, dynamic> data);
}

class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  final DioClient client;

  UserRemoteDataSourceImpl({required this.client});

  @override
  Future<UserModel> login(String email, String password) async {
    try {
      final response = await client.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw ServerException('Login failed');
      }
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<UserModel>> getUsers() async {
    try {
      final response = await client.get('/users');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => UserModel.fromJson(json)).toList();
      } else {
        throw ServerException('Failed to fetch users');
      }
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<UserModel> getUserById(String id) async {
    try {
      final response = await client.get('/users/$id');

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw ServerException('User not found');
      }
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<UserModel> updateUser(String id, Map<String, dynamic> data) async {
    try {
      final response = await client.put(
        '/users/$id',
        data: data,
      );

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw ServerException('Update failed');
      }
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
```

### API Rules
- **GUNAKAN Dio** untuk HTTP client (bukan http package)
- **Centralize API endpoints** dalam constants
- **Implement interceptors** untuk auth, logging, error handling
- **Handle timeouts** properly
- **Type safety** - gunakan models untuk parsing JSON
- **Error handling** - catch exceptions dan convert ke domain failures
- **JANGAN expose API keys** - use environment variables
- **Implement retry logic** untuk network failures

## 6. MODELS & SERIALIZATION

### Model Pattern
```dart
// domain/entities/user.dart (Entity - business logic)
class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, name, email, avatarUrl, createdAt];
}

// data/models/user_model.dart (Model - data layer)
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.name,
    required super.email,
    super.avatarUrl,
    required super.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      avatarUrl: json['avatar_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatar_url': avatarUrl,
      'created_at': createdAt.toIso8601String(),
    };
  }

  User toEntity() {
    return User(
      id: id,
      name: name,
      email: email,
      avatarUrl: avatarUrl,
      createdAt: createdAt,
    );
  }

  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    );
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? avatarUrl,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
```

### JSON Serialization (Freezed - Recommended)
```dart
// Install: freezed, freezed_annotation, json_annotation, json_serializable

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    String? avatarUrl,
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

// Generate code: flutter pub run build_runner build --delete-conflicting-outputs
```

### Model Rules
- **Separate Entity dan Model** untuk Clean Architecture
- **GUNAKAN Freezed** untuk immutability dan copyWith (recommended)
- **GUNAKAN json_serializable** untuk code generation
- **Handle null safety** properly
- **Custom JSON keys** dengan @JsonKey annotation
- **Implement copyWith** untuk immutable updates
- **Extend Equatable** untuk value equality

## 7. LOCAL STORAGE

### Shared Preferences (Simple Data)
```dart
// core/storage/local_storage.dart
class LocalStorage {
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'user_data';
  static const String _keyTheme = 'theme_mode';

  final SharedPreferences _prefs;

  LocalStorage({required SharedPreferences prefs}) : _prefs = prefs;

  // String
  Future<void> saveToken(String token) async {
    await _prefs.setString(_keyToken, token);
  }

  String? getToken() {
    return _prefs.getString(_keyToken);
  }

  // Object (JSON)
  Future<void> saveUser(User user) async {
    final userJson = jsonEncode(user.toJson());
    await _prefs.setString(_keyUser, userJson);
  }

  User? getUser() {
    final userJson = _prefs.getString(_keyUser);
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    return null;
  }

  // Bool
  Future<void> setDarkMode(bool isDark) async {
    await _prefs.setBool(_keyTheme, isDark);
  }

  bool isDarkMode() {
    return _prefs.getBool(_keyTheme) ?? false;
  }

  // Clear
  Future<void> clear() async {
    await _prefs.clear();
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }
}
```

### Secure Storage (Sensitive Data)
```dart
// core/storage/secure_storage.dart
class SecureStorage {
  final FlutterSecureStorage _storage;

  SecureStorage({required FlutterSecureStorage storage}) : _storage = storage;

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: 'refresh_token', value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<void> deleteAll() async {
    await _storage.deleteAll();
  }
}
```

### Hive (Complex Data)
```dart
// Setup Hive
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Hive.initFlutter();
  Hive.registerAdapter(UserAdapter());
  
  await Hive.openBox<User>('users');
  
  runApp(const MyApp());
}

// models/user.dart
@HiveType(typeId: 0)
class User extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String email;

  User({
    required this.id,
    required this.name,
    required this.email,
  });
}

// Usage
class UserLocalDataSource {
  final Box<User> userBox;

  UserLocalDataSource({required this.userBox});

  Future<void> cacheUser(User user) async {
    await userBox.put(user.id, user);
  }

  User? getCachedUser(String id) {
    return userBox.get(id);
  }

  List<User> getAllUsers() {
    return userBox.values.toList();
  }

  Future<void> deleteUser(String id) async {
    await userBox.delete(id);
  }

  Future<void> clearAll() async {
    await userBox.clear();
  }
}
```

### Storage Rules
- **SharedPreferences**: Simple key-value data (settings, flags)
- **FlutterSecureStorage**: Sensitive data (tokens, passwords)
- **Hive**: Complex objects, offline-first apps
- **SQLite**: Relational data, complex queries
- **JANGAN store sensitive data** di SharedPreferences
- **Encrypt sensitive data** sebelum save
- **Handle storage errors** dengan try-catch

## 8. ERROR HANDLING

### Failure & Exception Pattern
```dart
// core/errors/failures.dart
abstract class Failure extends Equatable {
  final String message;

  const Failure({required this.message});

  @override
  List<Object> get props => [message];
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message});
}

class NetworkFailure extends Failure {
  const NetworkFailure({required super.message});
}

class CacheFailure extends Failure {
  const CacheFailure({required super.message});
}

class ValidationFailure extends Failure {
  const ValidationFailure({required super.message});
}

// core/errors/exceptions.dart
class ServerException implements Exception {
  final String message;
  ServerException(this.message);
}

class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);
}

class CacheException implements Exception {
  final String message;
  CacheException(this.message);
}
```

### Either Pattern (dartz)
```dart
// domain/repositories/user_repository.dart
abstract class UserRepository {
  Future<Either<Failure, User>> login(String email, String password);
  Future<Either<Failure, List<User>>> getUsers();
  Future<Either<Failure, User>> getUserById(String id);
}

// data/repositories/user_repository_impl.dart
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource remoteDataSource;
  final UserLocalDataSource localDataSource;
  final NetworkInfo networkInfo;

  UserRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    try {
      final user = await remoteDataSource.login(email, password);
      await localDataSource.cacheUser(user);
      return Right(user.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, List<User>>> getUsers() async {
    if (await networkInfo.isConnected) {
      try {
        final users = await remoteDataSource.getUsers();
        await localDataSource.cacheUsers(users);
        return Right(users.map((model) => model.toEntity()).toList());
      } on ServerException catch (e) {
        return Left(ServerFailure(message: e.message));
      }
    } else {
      try {
        final cachedUsers = await localDataSource.getCachedUsers();
        return Right(cachedUsers.map((model) => model.toEntity()).toList());
      } on CacheException catch (e) {
        return Left(CacheFailure(message: e.message));
      }
    }
  }
}
```

### Error Handling Rules
- **GUNAKAN Either type** untuk error handling (dartz package)
- **Separate Failures (domain) dan Exceptions (data layer)**
- **Catch specific exceptions** - jangan generic catch
- **Map exceptions to failures** di repository layer
- **Show user-friendly errors** di presentation layer
- **Log errors** untuk debugging

## 9. DEPENDENCY INJECTION

### GetIt Setup
```dart
// di/injection_container.dart
final sl = GetIt.instance;

Future<void> initializeDependencies() async {
  // External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);

  sl.registerLazySingleton(() => const FlutterSecureStorage());
  sl.registerLazySingleton(() => Dio());
  sl.registerLazySingleton(() => InternetConnectionChecker());

  // Core
  sl.registerLazySingleton<NetworkInfo>(
    () => NetworkInfoImpl(sl()),
  );

  sl.registerLazySingleton<DioClient>(
    () => DioClient(dio: sl(), storage: sl()),
  );

  sl.registerLazySingleton<LocalStorage>(
    () => LocalStorage(prefs: sl()),
  );

  // Data sources
  sl.registerLazySingleton<UserRemoteDataSource>(
    () => UserRemoteDataSourceImpl(client: sl()),
  );

  sl.registerLazySingleton<UserLocalDataSource>(
    () => UserLocalDataSourceImpl(storage: sl()),
  );

  // Repositories
  sl.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      networkInfo: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => GetCurrentUserUseCase(sl()));
  sl.registerLazySingleton(() => GetUsersUseCase(sl()));

  // BLoC
  sl.registerFactory(
    () => AuthBloc(
      loginUseCase: sl(),
      logoutUseCase: sl(),
      getCurrentUserUseCase: sl(),
    ),
  );

  sl.registerFactory(
    () => UserBloc(
      getUsersUseCase: sl(),
    ),
  );
}

// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDependencies();
  runApp(const MyApp());
}

// Usage in widget
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<AuthBloc>(),
      child: const LoginView(),
    );
  }
}
```

### DI Rules
- **GUNAKAN get_it** untuk dependency injection
- **registerLazySingleton**: Single instance, created when first accessed
- **registerFactory**: New instance every time
- **registerSingleton**: Created immediately
- **Initialize di main()** sebelum runApp()
- **Inject dependencies** via constructor, JANGAN direct access

## 10. THEMING

### Theme Setup
```dart
// config/theme/app_theme.dart
class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color secondaryColor = Color(0xFF03DAC6);
  static const Color errorColor = Color(0xFFB00020);
  static const Color backgroundColor = Color(0xFFF5F5F5);

  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: backgroundColor,
    
    // AppBar
    appBarTheme: const AppBarTheme(
      elevation: 0,
      centerTitle: true,
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      iconTheme: IconThemeData(color: Colors.white),
    ),

    // ElevatedButton
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),

    // TextButton
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
      ),
    ),

    // OutlinedButton
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),

    // InputDecoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.grey),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.grey),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: errorColor),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),

    // Card
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ),

    // Text
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
      titleLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        color: Colors.black87,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        color: Colors.black87,
      ),
    ),
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      brightness: Brightness.dark,
    ),
    
    // Customize dark theme similarly...
  );
}

// constants/app_colors.dart
class AppColors {
  // Primary
  static const Color primary = Color(0xFF2196F3);
  static const Color primaryLight = Color(0xFF64B5F6);
  static const Color primaryDark = Color(0xFF1976D2);

  // Secondary
  static const Color secondary = Color(0xFF03DAC6);
  static const Color secondaryLight = Color(0xFF66FFF9);
  static const Color secondaryDark = Color(0xFF00A896);

  // Status
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);

  // Neutral
  static const Color black = Color(0xFF000000);
  static const Color white = Color(0xFFFFFFFF);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color greyLight = Color(0xFFE0E0E0);
  static const Color greyDark = Color(0xFF616161);

  // Background
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
}

// constants/app_text_styles.dart
class AppTextStyles {
  static const TextStyle h1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle subtitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle body = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
  );

  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );
}
```

### Theme Rules
- **Centralize theme** dalam satu file
- **Use Material 3** dengan useMaterial3: true
- **Define color schemes** properly
- **Consistent spacing** - gunakan multiples of 4 atau 8
- **Typography scale** - follow Material Design guidelines
- **Dark mode support** - always implement
- **JANGAN hardcode colors** - use theme colors

## 11. ASSETS & IMAGES

### Asset Management
```dart
// pubspec.yaml
flutter:
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/
  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
        - asset: assets/fonts/Poppins-Bold.ttf
          weight: 700

// constants/app_assets.dart
class AppAssets {
  // Images
  static const String logo = 'assets/images/logo.png';
  static const String placeholder = 'assets/images/placeholder.png';
  static const String avatar = 'assets/images/avatar.png';

  // Icons
  static const String iconHome = 'assets/icons/home.svg';
  static const String iconProfile = 'assets/icons/profile.svg';
  static const String iconSettings = 'assets/icons/settings.svg';

  // Animations
  static const String animLoading = 'assets/animations/loading.json';
  static const String animSuccess = 'assets/animations/success.json';
}

// Usage
Image.asset(
  AppAssets.logo,
  width: 100,
  height: 100,
  fit: BoxFit.contain,
)

// For SVG
SvgPicture.asset(
  AppAssets.iconHome,
  width: 24,
  height: 24,
  color: AppColors.primary,
)

// Cached Network Image
CachedNetworkImage(
  imageUrl: user.avatarUrl,
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  width: 100,
  height: 100,
  fit: BoxFit.cover,
)
```

### Asset Rules
- **Organize assets** by type (images/, icons/, fonts/)
- **Use SVG** untuk icons (flutter_svg package)
- **Use cached_network_image** untuk network images
- **Provide placeholder** dan error widgets
- **Optimize images** - use appropriate sizes
- **JANGAN load large images** - resize sebelum display

## 12. VALIDATION & FORMS

### Form Validation
```dart
// utils/validators.dart
class Validators {
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    final phoneRegex = RegExp(r'^\+?[\d\s-]{10,}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  static String? minLength(String? value, int length) {
    if (value == null || value.isEmpty) {
      return 'This field is required';
    }
    if (value.length < length) {
      return 'Must be at least $length characters';
    }
    return null;
  }

  static String? maxLength(String? value, int length) {
    if (value != null && value.length > length) {
      return 'Must not exceed $length characters';
    }
    return null;
  }

  static String? url(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Optional field
    }
    final urlRegex = RegExp(
      r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b',
    );
    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL';
    }
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }
}

// Usage in Form
class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (_formKey.currentState!.validate()) {
      // Process form
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      
      context.read<AuthBloc>().add(
        LoginRequested(email: email, password: password),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            validator: Validators.email,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            decoration: const InputDecoration(
              labelText: 'Password',
              prefixIcon: Icon(Icons.lock),
            ),
            obscureText: true,
            textInputAction: TextInputAction.done,
            validator: Validators.password,
            onFieldSubmitted: (_) => _onSubmit(),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _onSubmit,
              child: const Text('Login'),
            ),
          ),
        ],
      ),
    );
  }
}
```

### Form Rules
- **SELALU validate input** - never trust user input
- **Centralize validators** dalam utils
- **Use GlobalKey<FormState>** untuk form validation
- **Dispose controllers** di dispose method
- **Show clear error messages** - user-friendly
- **Validate on submit** - jangan validate setiap keystroke kecuali perlu
- **Trim input** sebelum submit

## 13. PERFORMANCE OPTIMIZATION

### Performance Tips
```dart
// 1. Use const constructors
const Text('Hello'); // GOOD
Text('Hello'); // BAD jika bisa const

// 2. Extract static widgets
class MyWidget extends StatelessWidget {
  static const _title = Text('Title'); // Reused, tidak rebuild

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _title,
        // Other widgets...
      ],
    );
  }
}

// 3. Use ListView.builder untuk long lists
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ItemWidget(item: items[index]);
  },
)

// 4. Implement AutomaticKeepAliveClientMixin untuk preserve state
class MyPage extends StatefulWidget {
  @override
  State<MyPage> createState() => _MyPageState();
}

class _MyPageState extends State<MyPage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Don't forget this!
    return Container();
  }
}

// 5. Use RepaintBoundary untuk complex widgets
RepaintBoundary(
  child: ComplexWidget(),
)

// 6. Lazy load images
Image.network(
  url,
  loadingBuilder: (context, child, loadingProgress) {
    if (loadingProgress == null) return child;
    return CircularProgressIndicator();
  },
)

// 7. Use cached_network_image
CachedNetworkImage(
  imageUrl: url,
  memCacheWidth: 200, // Resize in memory
  memCacheHeight: 200,
)
```

### Performance Rules
- **GUNAKAN const** wherever possible
- **Extract widgets** - jangan nested build methods
- **ListView.builder** untuk dynamic lists
- **GridView.builder** untuk grids
- **Image caching** dengan cached_network_image
- **Lazy loading** untuk expensive operations
- **Debounce/Throttle** search inputs
- **Profile app** dengan Flutter DevTools

## 14. TESTING

### Unit Test
```dart
// test/features/auth/domain/usecases/login_usecase_test.dart
void main() {
  late LoginUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LoginUseCase(mockRepository);
  });

  const tEmail = 'test@example.com';
  const tPassword = 'password123';
  const tUser = User(
    id: '1',
    name: 'Test User',
    email: tEmail,
    createdAt: '2024-01-01',
  );

  test('should return User when login is successful', () async {
    // arrange
    when(mockRepository.login(any, any))
        .thenAnswer((_) async => const Right(tUser));

    // act
    final result = await useCase(
      const LoginParams(email: tEmail, password: tPassword),
    );

    // assert
    expect(result, const Right(tUser));
    verify(mockRepository.login(tEmail, tPassword));
    verifyNoMoreInteractions(mockRepository);
  });

  test('should return Failure when login fails', () async {
    // arrange
    when(mockRepository.login(any, any))
        .thenAnswer((_) async => const Left(ServerFailure(message: 'Error')));

    // act
    final result = await useCase(
      const LoginParams(email: tEmail, password: tPassword),
    );

    // assert
    expect(result, const Left(ServerFailure(message: 'Error')));
    verify(mockRepository.login(tEmail, tPassword));
  });
}
```

### Widget Test
```dart
// test/features/auth/presentation/pages/login_page_test.dart
void main() {
  testWidgets('should show login form', (tester) async {
    // Build widget
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider(
          create: (_) => MockAuthBloc(),
          child: const LoginPage(),
        ),
      ),
    );

    // Verify
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });

  testWidgets('should show error when login fails', (tester) async {
    final mockBloc = MockAuthBloc();
    
    whenListen(
      mockBloc,
      Stream.fromIterable([
        const AuthLoading(),
        const AuthError(message: 'Invalid credentials'),
      ]),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider.value(
          value: mockBloc,
          child: const LoginPage(),
        ),
      ),
    );

    await tester.pump();

    expect(find.text('Invalid credentials'), findsOneWidget);
  });
}
```

### Integration Test
```dart
// integration_test/app_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete login flow', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Find email field and enter text
    final emailField = find.byKey(const Key('email_field'));
    await tester.enterText(emailField, 'test@example.com');

    // Find password field and enter text
    final passwordField = find.byKey(const Key('password_field'));
    await tester.enterText(passwordField, 'password123');

    // Tap login button
    final loginButton = find.text('Login');
    await tester.tap(loginButton);
    await tester.pumpAndSettle();

    // Verify navigation to home page
    expect(find.text('Home'), findsOneWidget);
  });
}
```

### Testing Rules
- **Unit tests** untuk business logic (usecases, repositories)
- **Widget tests** untuk UI components
- **Integration tests** untuk critical user flows
- **Mock dependencies** dengan mockito
- **Test BLoC** dengan bloc_test package
- **Aim for >80% coverage** untuk core features
- **Test error cases** - jangan hanya happy path

## 15. SECURITY

### Security Checklist
```dart
// 1. Secure Storage untuk sensitive data
final storage = FlutterSecureStorage();
await storage.write(key: 'auth_token', value: token);

// 2. SSL Pinning
class DioClient {
  DioClient() {
    (_dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate =
        (client) {
      client.badCertificateCallback =
          (X509Certificate cert, String host, int port) {
        // Implement SSL pinning
        return cert.sha256.toString() == expectedSha256;
      };
      return client;
    };
  }
}

// 3. Obfuscate code (production build)
// flutter build apk --obfuscate --split-debug-info=/<project-name>/<directory>

// 4. Environment variables
// Use flutter_dotenv
await dotenv.load(fileName: '.env');
final apiKey = dotenv.env['API_KEY'];

// 5. Input validation - ALWAYS
final sanitized = input.trim().replaceAll(RegExp(r'[^\w\s]'), '');

// 6. Prevent screenshots (sensitive screens)
// Use flutter_windowmanager (Android)
await FlutterWindowManager.addFlags(FlutterWindowManager.FLAG_SECURE);

// 7. Jailbreak/Root detection
// Use flutter_jailbreak_detection
bool isJailBroken = await FlutterJailbreakDetection.jailbroken;
```

### Security Rules
- **JANGAN hardcode API keys** - use environment variables
- **Encrypt sensitive data** sebelum store
- **Use HTTPS** untuk semua network calls
- **Implement SSL pinning** untuk production
- **Obfuscate code** di production builds
- **Validate ALL input** - never trust user input
- **Handle biometric auth** dengan local_auth
- **Implement session timeout**
- **Clear sensitive data** on logout

## CRITICAL RULES - MUST FOLLOW

1. **ALWAYS use const constructors** - Performance critical
2. **ALWAYS dispose controllers** - Prevent memory leaks
3. **NEVER put business logic in widgets** - Use BLoC/Provider
4. **ALWAYS handle errors** - Use Either/Result pattern
5. **ALWAYS validate user input** - Security critical
6. **GUNAKAN dependency injection** - GetIt/Injectable
7. **SEPARATE UI and business logic** - Clean Architecture
8. **ALWAYS use models** untuk JSON parsing - Type safety
9. **IMPLEMENT proper state management** - BLoC/Riverpod/Provider
10. **TEST critical features** - Unit + Widget + Integration tests

## CODE GENERATION CHECKLIST

When generating Flutter code, ensure:
1. ✅ Proper folder structure (feature-first or clean architecture)
2. ✅ State management implementation (BLoC preferred)
3. ✅ Models dengan proper JSON serialization
4. ✅ Repository pattern dengan Either error handling
5. ✅ Dependency injection setup
6. ✅ Form validation
7. ✅ Error handling di semua layers
8. ✅ Proper widget extraction
9. ✅ Const constructors dimana memungkinkan
10. ✅ Dispose resources properly
11. ✅ Theme consistency
12. ✅ Navigation setup (go_router)
13. ✅ Loading states
14. ✅ Empty states
15. ✅ Error states

## COMMON PACKAGES

Essential packages untuk Flutter development:
```yaml
dependencies:
  # State Management
  flutter_bloc: ^8.1.3
  provider: ^6.0.5
  riverpod: ^2.4.0
  
  # Networking
  dio: ^5.3.3
  retrofit: ^4.0.3
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  hive: ^2.2.3
  
  # Dependency Injection
  get_it: ^7.6.4
  injectable: ^2.3.2
  
  # Routing
  go_router: ^12.1.1
  
  # Utils
  equatable: ^2.0.5
  dartz: ^0.10.1
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  
  # UI
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.9
  shimmer: ^3.0.0
  
  # Forms
  form_field_validator: ^1.1.0
  
dev_dependencies:
  # Code Generation
  build_runner: ^2.4.6
  freezed: ^2.4.5
  json_serializable: ^6.7.1
  injectable_generator: ^2.4.1
  
  # Testing
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4
  bloc_test: ^9.1.5
```

---

**Last Updated**: Generated for AI Agent
**Version**: 1.0
**Framework**: Flutter 3.x