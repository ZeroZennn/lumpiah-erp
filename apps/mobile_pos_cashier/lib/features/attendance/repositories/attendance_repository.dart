import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../auth/services/auth_service.dart';
import '../models/attendance_model.dart';

enum AttendanceStatus { checkedIn, checkedOut, notCheckedIn }

class AttendanceRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();

  /// Clock In (Masuk)
  Future<bool> clockIn() async {
    try {
      final token = await _authService.getToken();
      if (token == null) throw Exception('Unauthorized');

      final response = await _apiClient.dio.post(
        '/attendance/clock-in',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      return response.statusCode == 201;
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        throw Exception(e.response?.data['message'] ?? 'Already clocked in');
      }
      throw Exception('Failed to clock in: ${e.message}');
    }
  }

  /// Clock Out (Keluar)
  Future<bool> clockOut() async {
    try {
      final token = await _authService.getToken();
      if (token == null) throw Exception('Unauthorized');

      final response = await _apiClient.dio.post(
        '/attendance/clock-out',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      return response.statusCode == 200;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Belum absen masuk hari ini');
      }
      throw Exception('Failed to clock out: ${e.message}');
    }
  }

  /// Get Attendance History
  Future<List<AttendanceModel>> getHistory() async {
    try {
      final token = await _authService.getToken();
      if (token == null) throw Exception('Unauthorized');

      final response = await _apiClient.dio.get(
        '/attendance/me',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return (response.data as List)
            .map((e) => AttendanceModel.fromJson(e))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch history: $e');
    }
  }

  /// Check Today's Status: Returns AttendanceModel if exists for today (ui logic checks clockOut null state)
  Future<AttendanceModel?> getTodayStatus() async {
    try {
      final history = await getHistory();
      if (history.isEmpty) return null;

      final today = DateTime.now();
      final lastRecord = history.first; // Assuming sorted desc from API

      // Check if record is from today (Day, Month, Year match)
      final recordDate = lastRecord.date.toLocal();
      final isToday =
          recordDate.year == today.year &&
          recordDate.month == today.month &&
          recordDate.day == today.day;

      if (!isToday) {
        return null;
      }

      return lastRecord;
    } catch (e) {
      return null;
    }
  }
}
