import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/api/api_client.dart';

class AuthService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final ApiClient _api = ApiClient();

  /// Login method
  /// Returns true on successful login, throws exception on failure
  Future<bool> login(String email, String password) async {
    try {
      final response = await _api.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      // On 201 Created
      if (response.statusCode == 201) {
        final accessToken = response.data['accessToken'];

        // Save token to secure storage
        await _storage.write(key: 'access_token', value: accessToken);

        return true;
      }

      return false;
    } on DioException catch (e) {
      // Handle 401 Unauthorized
      if (e.response?.statusCode == 401) {
        throw Exception('Email atau Password salah');
      }

      // Generic error for other DioExceptions
      throw Exception('Terjadi kesalahan: ${e.message}');
    } catch (e) {
      throw Exception('Terjadi kesalahan yang tidak diketahui');
    }
  }

  /// Get stored access token
  Future<String?> getToken() async {
    return await _storage.read(key: 'access_token');
  }

  /// Logout and clear all stored data
  Future<void> logout() async {
    await _storage.deleteAll();
  }
}
