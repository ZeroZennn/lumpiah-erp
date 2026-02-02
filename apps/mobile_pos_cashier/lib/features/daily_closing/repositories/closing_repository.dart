import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../models/daily_closing_model.dart';
import '../../auth/services/auth_service.dart';

class ClosingRepository {
  final Dio _dio = ApiClient().dio;
  final AuthService _authService = AuthService();

  Future<Options> _getOptions() async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('User not logged in');
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
  }

  Future<DailyClosingPreview> getClosingPreview() async {
    try {
      final options = await _getOptions();
      final response = await _dio.get(
        '/daily-closing/preview',
        options: options,
      );
      return DailyClosingPreview.fromJson(response.data);
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 401) {
        throw Exception('Sesi habis. Silakan login ulang.');
      }
      throw Exception('Failed to get closing preview: $e');
    }
  }

  Future<DailyClosingResult> submitClosing({
    required double actualCash,
    required double actualQris,
    String? note,
  }) async {
    try {
      final options = await _getOptions();
      final response = await _dio.post(
        '/daily-closing',
        data: {
          'totalCashActual': actualCash,
          'totalQrisActual': actualQris,
          'closingNote': note,
        },
        options: options,
      );
      return DailyClosingResult.fromJson(response.data);
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? e.message;
      if (e.response?.statusCode == 401) {
        throw Exception('Sesi habis. Silakan login ulang.');
      }
      throw Exception(msg);
    } catch (e) {
      throw Exception('Failed to submit closing: $e');
    }
  }
}
