import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../features/auth/services/auth_service.dart';
import '../../../local_db/entities/local_product.dart';

class ProductRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();

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

        return products;
      } else {
        throw Exception('Failed to fetch products: ${response.statusCode}');
      }
    } on DioException catch (e) {
      // Handle Dio-specific errors
      if (e.response?.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else if (e.response?.statusCode == 403) {
        throw Exception('Forbidden. You do not have access to this resource.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Products endpoint not found.');
      } else if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception(
          'Connection timeout. Please check your internet connection.',
        );
      } else if (e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Server is taking too long to respond.');
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      // Handle any other errors
      throw Exception('Failed to fetch products: $e');
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
