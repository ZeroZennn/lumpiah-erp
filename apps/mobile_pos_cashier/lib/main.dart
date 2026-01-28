import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

// Local DB Entities
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_transaction.dart';

// Features
import 'package:mobile_pos_cashier/features/pos/repositories/pos_repository.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';
import 'package:mobile_pos_cashier/features/pos/screens/pos_screen.dart';

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
          theme: ThemeData(
            useMaterial3: true,
            // Color Scheme with Warm Yellow palette
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFFFFC107),
              primary: const Color(0xFFFFB300),
              surface: Colors.white,
              onPrimary: Colors.white,
              onSurface: const Color(0xFF2D2D2D),
            ),
            // Off-White background for reduced eye strain
            scaffoldBackgroundColor: const Color(0xFFF5F5F5),
            // AppBar Theme: White background, no elevation, dark text
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.white,
              elevation: 0,
              scrolledUnderElevation: 0,
              iconTheme: IconThemeData(color: Color(0xFF2D2D2D)),
              titleTextStyle: TextStyle(
                color: Color(0xFF2D2D2D),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            // Elevated Button Theme: Warm Yellow with White text
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFB300),
                foregroundColor: Colors.white,
                elevation: 2,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            // Card Theme: White with subtle shadow
            cardTheme: CardThemeData(
              color: Colors.white,
              elevation: 2,
              shadowColor: Colors.black.withAlpha(25),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            // Text Theme: Dark Grey instead of pure black
            textTheme: const TextTheme(
              headlineLarge: TextStyle(
                color: Color(0xFF2D2D2D),
                fontWeight: FontWeight.bold,
              ),
              headlineMedium: TextStyle(
                color: Color(0xFF2D2D2D),
                fontWeight: FontWeight.bold,
              ),
              headlineSmall: TextStyle(
                color: Color(0xFF2D2D2D),
                fontWeight: FontWeight.w600,
              ),
              bodyLarge: TextStyle(color: Color(0xFF2D2D2D)),
              bodyMedium: TextStyle(color: Color(0xFF2D2D2D)),
              bodySmall: TextStyle(color: Color(0xFF5A5A5A)),
            ),
            // Divider Theme
            dividerTheme: const DividerThemeData(
              color: Color(0xFFE0E0E0),
              thickness: 1,
            ),
          ),
          home: const PosScreen(),
        ),
      ),
    );
  }
}
