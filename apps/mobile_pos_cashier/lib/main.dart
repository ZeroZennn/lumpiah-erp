import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

// Core
import 'package:mobile_pos_cashier/core/theme/app_theme.dart';

// Auth
import 'package:mobile_pos_cashier/features/auth/services/auth_service.dart';
import 'package:mobile_pos_cashier/features/auth/screens/login_screen.dart';

// POS
import 'package:mobile_pos_cashier/features/pos/screens/pos_screen.dart';
import 'package:mobile_pos_cashier/features/pos/repositories/pos_repository.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';

// Local DB Entities
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_transaction.dart';

void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Get application documents directory
  final dir = await getApplicationDocumentsDirectory();

  // Initialize Isar database
  final isar = await Isar.open([
    LocalProductSchema,
    LocalTransactionSchema,
    LocalTransactionItemSchema,
  ], directory: dir.path);

  // Run the app
  runApp(MyApp(isar: isar));
}

/// Root widget of the Lumpia POS application.
class MyApp extends StatelessWidget {
  final Isar isar;

  const MyApp({super.key, required this.isar});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        // Provide PosRepository with Isar instance
        RepositoryProvider<PosRepository>(
          create: (context) => PosRepository(isar),
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          // Provide CartCubit
          BlocProvider<CartCubit>(create: (context) => CartCubit()),
        ],
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Lumpia POS',
          theme: AppTheme.lightTheme,
          home: FutureBuilder<String?>(
            future: AuthService().getToken(),
            builder: (context, snapshot) {
              // Waiting state
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Scaffold(
                  body: Center(child: CircularProgressIndicator()),
                );
              }

              // Check if token exists
              final token = snapshot.data;
              if (token != null && token.isNotEmpty) {
                // Token exists - show PosScreen
                return const PosScreen();
              } else {
                // No token - show LoginScreen
                return const LoginScreen();
              }
            },
          ),
        ),
      ),
    );
  }
}
