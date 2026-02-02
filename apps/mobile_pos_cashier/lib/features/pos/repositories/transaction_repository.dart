import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:uuid/uuid.dart';
import 'package:isar/isar.dart';
import '../../../core/api/api_client.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/services/local_db_service.dart';
import '../../../local_db/entities/local_transaction.dart';

/// Repository for handling transaction-related API operations.
class TransactionRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();
  // Access Isar instance from Singleton
  final Isar _localDb = LocalDbService().isar;

  /// Creates a new transaction.
  ///
  /// Supports offline mode:
  /// 1. If offline, saves to Isar DB.
  /// 2. If online, tries to send to API.
  /// 3. If API fails (network error), falls back to Isar DB.
  /// 4. If API fails (server error 500), throws exception.
  Future<bool> createTransaction({
    required List<Map<String, dynamic>> cartItems,
    required double totalAmount,
    required String paymentMethod,
    double? cashReceived,
  }) async {
    // 1. Generate UUID (Must be done here)
    final transactionId = const Uuid().v4();

    // 2. Prepare Payload
    final mappedItems = cartItems.map((item) {
      return {
        'productId': item['productId'],
        'quantity': item['quantity'],
        'price': item['price'],
      };
    }).toList();

    final body = {
      'transactionId': transactionId, // Critical for idempotency
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      'items': mappedItems,
      'transactionDate': DateTime.now().toIso8601String(), // Include local time
    };

    if (paymentMethod == 'CASH' && cashReceived != null) {
      body['cashReceived'] = cashReceived;
    }

    // 3. Check Connectivity
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.none)) {
      // Offline Flow
      await _saveOfflineTransaction(transactionId, body);
      return true;
    }

    try {
      // 4. Online Flow
      final token = await _authService.getToken();

      // If no token but online, we might be in a weird state (session expired).
      // However, for typical POS, if we can't auth, we can't post to secure API.
      // We will attempt to save offline IF it's a network issue, but Auth failure is usually 401.
      if (token == null) {
        throw Exception('Tidak ada token. Silakan login terlebih dahulu.');
      }

      final response = await _apiClient.dio.post(
        '/transactions',
        data: body,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 201) {
        return true;
      } else {
        throw Exception(
          'Gagal membuat transaksi. Status: ${response.statusCode}',
        );
      }
    } on DioException catch (e) {
      // 5. Catch Error -> Fallback to Offline Flow
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionError ||
          (e.error != null && e.error.toString().contains('SocketException'))) {
        await _saveOfflineTransaction(transactionId, body);
        return true;
      }

      // Handle specific Server Errors (Do NOT save offline)
      if (e.response?.statusCode == 400) {
        throw Exception(
          'Data tidak valid: ${e.response?.data['message'] ?? 'Bad Request'}',
        );
      }

      if (e.response?.statusCode == 500) {
        throw Exception('Server error (500). Silakan coba lagi.');
      }

      // Default rethrow for other API errors (e.g. 401, 403)
      throw Exception('Terjadi kesalahan API: ${e.message}');
    } catch (e) {
      // Unknown error - safer to rethrow than to assume offline-safe
      rethrow;
    }
  }

  /// Syncs offline transactions to the server.
  /// Returns a Map with the sync summary (syncedCount, duplicatesSkipped) or message.
  Future<Map<String, dynamic>> syncOfflineData() async {
    // 1. Check Internet
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.none)) {
      throw Exception('Tidak ada koneksi internet (Offline).');
    }

    // 2. Query Isar: Get all LocalTransaction where isSynced == false
    final unsyncedTransactions = await _localDb.localTransactions
        .filter()
        .isSyncedEqualTo(false)
        .findAll();

    // 3. If list is empty
    if (unsyncedTransactions.isEmpty) {
      return {'message': 'No data to sync'};
    }

    // 4. Process Batch
    final List<Map<String, dynamic>> syncPayload = [];
    for (var tx in unsyncedTransactions) {
      final Map<String, dynamic> data = jsonDecode(tx.payload);

      // Ensure transactionDate is sent
      if (!data.containsKey('transactionDate')) {
        data['transactionDate'] = tx.createdAt.toIso8601String();
      }

      // Ensure ID is present (map transactionId to id if needed)
      if (!data.containsKey('id')) {
        data['id'] = tx.transactionId;
      }

      syncPayload.add(data);
    }

    try {
      final token = await _authService.getToken();
      if (token == null) throw Exception('Unauthorized: Silakan login.');

      // 5. API Call
      final response = await _apiClient.dio.post(
        '/transactions/sync',
        data: syncPayload,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      // 6. On Success (200/201)
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Mark isSynced = true
        await _localDb.writeTxn(() async {
          for (var tx in unsyncedTransactions) {
            tx.isSynced = true;
            await _localDb.localTransactions.put(tx);
          }
        });

        // Return the API response (summary)
        // Expected: { syncedCount: number, duplicatesSkipped: number }
        return Map<String, dynamic>.from(response.data);
      } else {
        throw Exception('Sync failed: ${response.statusCode}');
      }
    } catch (e) {
      // 7. On Fail: Throw error
      throw Exception('Gagal sinkronisasi: $e');
    }
  }

  /// Get the count of pending offline transactions
  Future<int> getUnsyncedCount() async {
    return await _localDb.localTransactions
        .filter()
        .isSyncedEqualTo(false)
        .count();
  }

  /// Helper to save transaction locally
  Future<void> _saveOfflineTransaction(
    String transactionId,
    Map<String, dynamic> body,
  ) async {
    final newTransaction = LocalTransaction(
      transactionId: transactionId,
      payload: jsonEncode(body),
      createdAt: DateTime.now(),
      isSynced: false,
    );

    await _localDb.writeTxn(() async {
      await _localDb.localTransactions.put(newTransaction);
    });
  }

  Future<List<Map<String, dynamic>>> getTransactions({
    required DateTime date,
  }) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Unauthorized');
      }

      // Format dates for startDate and endDate (beginning and end of day)
      final startDate = DateTime(
        date.year,
        date.month,
        date.day,
      ).toIso8601String();
      final endDate = DateTime(
        date.year,
        date.month,
        date.day,
        23,
        59,
        59,
      ).toIso8601String();

      final response = await _apiClient.dio.get(
        '/transactions',
        queryParameters: {
          'startDate': startDate,
          'endDate': endDate,
          'page': 1,
          'limit': 100, // Reasonable limit for daily history
        },
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Failed to fetch transactions');
      }
    } catch (e) {
      // In offline mode or error, we could try to fetch from local Isar for sync pending ones,
      // but typically history requires online. For simple implementation, just rethrow or return empty.
      // Or checking local DB for today's transactions?
      // For now, let's just return what we have in local if online fails, OR just throw.
      // Requirements didn't specify offline history, so we'll likely stick to API first.
      rethrow;
    }
  }

  Future<bool> voidTransaction({
    required String transactionId,
    required String adminUsername,
    required String adminPassword,
    required String reason,
  }) async {
    try {
      final token = await _authService.getToken();

      final response = await _apiClient.dio.post(
        '/transactions/$transactionId/void',
        data: {
          'adminUsername': adminUsername,
          'adminPassword': adminPassword,
          'reason': reason,
        },
        options: Options(
          headers: {
            'Authorization':
                'Bearer $token', // Ensure authorized user makes request
          },
        ),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) {
        throw 'Password Admin Salah! Otorisasi gagal.';
      }
      if (e.response?.statusCode == 404) {
        throw 'Admin tidak ditemukan.';
      }
      throw 'Gagal membatalkan transaksi.';
    }
  }
}
