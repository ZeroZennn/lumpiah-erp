import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../auth/services/auth_service.dart';

/// Repository for handling transaction-related API operations.
class TransactionRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();

  /// Creates a new transaction on the server.
  ///
  /// [cartItems] - List of cart items with product details.
  /// [totalAmount] - The total amount for the transaction.
  /// [paymentMethod] - Payment method (e.g., 'CASH' or 'QRIS').
  ///
  /// Returns `true` if transaction is created successfully (status 201).
  /// Throws an exception on failure.
  Future<bool> createTransaction({
    required List<Map<String, dynamic>> cartItems,
    required double totalAmount,
    required String paymentMethod,
    double? cashReceived,
  }) async {
    try {
      // Get Bearer Token from AuthService
      final token = await _authService.getToken();

      if (token == null) {
        throw Exception('Tidak ada token. Silakan login terlebih dahulu.');
      }

      // Map cart items to backend DTO format
      final mappedItems = cartItems.map((item) {
        return {
          'productId': item['productId'], // int
          'quantity': item['quantity'], // int
          'price': item['price'], // double/number - snapshot price
        };
      }).toList();

      // Prepare request body
      final body = {
        'totalAmount': totalAmount,
        'paymentMethod': paymentMethod,
        'items': mappedItems,
      };

      // Add cashReceived if payment method is CASH and cashReceived is provided
      if (paymentMethod == 'CASH' && cashReceived != null) {
        body['cashReceived'] = cashReceived;
      }

      // Send POST request with Authorization header
      final response = await _apiClient.dio.post(
        '/transactions',
        data: body,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      // Check if status is 201 Created
      if (response.statusCode == 201) {
        return true;
      }

      // If not 201, throw error
      throw Exception(
        'Gagal membuat transaksi. Status: ${response.statusCode}',
      );
    } on DioException catch (e) {
      // Handle specific HTTP errors
      if (e.response?.statusCode == 401) {
        throw Exception('Unauthorized. Token tidak valid.');
      } else if (e.response?.statusCode == 400) {
        throw Exception(
          'Data tidak valid: ${e.response?.data['message'] ?? 'Bad Request'}',
        );
      } else if (e.response?.statusCode == 500) {
        throw Exception('Server error. Silakan coba lagi.');
      }

      // Generic Dio error
      throw Exception('Terjadi kesalahan: ${e.message}');
    } catch (e) {
      // Generic error
      throw Exception('Terjadi kesalahan yang tidak diketahui: $e');
    }
  }
}
