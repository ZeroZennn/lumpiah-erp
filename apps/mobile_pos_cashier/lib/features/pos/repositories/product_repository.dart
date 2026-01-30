import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import '../../../core/api/api_client.dart';
import '../../../features/auth/services/auth_service.dart';
import '../../../core/services/local_db_service.dart';
import '../../../local_db/entities/local_product.dart';

class ProductRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();
  final Isar _localDb = LocalDbService().isar;

  /// Fetch products from backend API
  /// Returns list of LocalProduct on success
  /// Throws exception on error with descriptive message
  Future<List<LocalProduct>> fetchProducts() async {
    try {
      // 1. Get Bearer Token
      final token = await _authService.getToken();

      if (token == null || token.isEmpty) {
        throw Exception('No authentication token found. Please login again.');
      }

      // 2. Make GET request to /products with Authorization header
      final response = await _apiClient.dio.get(
        '/products',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      // 3. Check response status
      if (response.statusCode == 200) {
        // 4. Parse response data
        final List<dynamic> data = response.data as List<dynamic>;

        // 5. Convert JSON list to List of LocalProduct
        final products = data
            .map((json) => LocalProduct.fromJson(json as Map<String, dynamic>))
            .toList();

        // 6. Cache to Isar (Clear old data -> Save new data)
        await _localDb.writeTxn(() async {
          await _localDb.localProducts.clear();
          await _localDb.localProducts.putAll(products);
        });

        return products;
      } else {
        throw Exception('Failed to fetch products: ${response.statusCode}');
      }
    } catch (e) {
      // Offline Flow (Fall back to Local DB)
      // Catching any error (DioException, SocketException, User not found, etc.)

      // Log for debugging
      // ignore: avoid_print
      print('Fetching products from local DB due to error: $e');

      final localProducts = await _localDb.localProducts.where().findAll();

      if (localProducts.isNotEmpty) {
        return localProducts;
      }

      // If local DB is also empty, rethrow the original error to show to user
      rethrow;
    }
  }

  /// Fetch products with graceful error handling (returns empty list on error)
  /// Use this if you want to avoid throwing exceptions
  Future<List<LocalProduct>> fetchProductsSafe() async {
    try {
      return await fetchProducts();
    } catch (e) {
      // Use debugPrint for production-safe logging
      // ignore: avoid_print
      print('Error fetching products: $e');
      return []; // Return empty list on error
    }
  }
}
