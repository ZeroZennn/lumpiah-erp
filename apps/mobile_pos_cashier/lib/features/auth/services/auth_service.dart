import 'dart:convert';
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
    print('User logged out');
  }

  /// Get branch name from token
  Future<String> getBranchName() async {
    final token = await getToken();
    if (token == null) return 'Cabang Utama';

    try {
      final payload = _parseJwt(token);
      final branchId = payload['branchId'];

      // Mapping branch ID to Name (should be dynamic in real app)
      switch (branchId) {
        case 1:
          return 'Semarang Pusat';
        case 2:
          return 'Cabang Jakarta';
        case 3:
          return 'Cabang Surabaya';
        default:
          return 'Cabang $branchId';
      }
    } catch (e) {
      return 'Cabang Utama';
    }
  }

  Map<String, dynamic> _parseJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      throw Exception('Invalid token');
    }
    final payload = _decodeBase64(parts[1]);
    final payloadMap = json.decode(payload);
    if (payloadMap is! Map<String, dynamic>) {
      throw Exception('Invalid payload');
    }
    return payloadMap;
  }

  String _decodeBase64(String str) {
    String output = str.replaceAll('-', '+').replaceAll('_', '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw Exception('Illegal base64url string!"');
    }
    return utf8.decode(base64Url.decode(output));
  }
}
