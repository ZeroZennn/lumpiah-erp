import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:mobile_pos_cashier/core/services/local_db_service.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_attendance.dart';

import '../../../core/api/api_client.dart';
import '../../auth/services/auth_service.dart';
import '../models/attendance_model.dart';

enum AttendanceStatus { checkedIn, checkedOut, notCheckedIn }

class AttendanceRepository {
  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();
  final LocalDbService _localDbService = LocalDbService();

  /// Check connectivity
  Future<bool> _isConnected() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return !connectivityResult.contains(ConnectivityResult.none);
  }

  /// Helper to save local attendance
  Future<bool> _saveLocalAttendance(String type) async {
    final localAttendance = LocalAttendance()
      ..type = type
      ..timestamp = DateTime.now()
      ..isSynced = false;

    await _localDbService.isar.writeTxn(() async {
      await _localDbService.isar.localAttendances.put(localAttendance);
    });

    return true;
  }

  /// Clock In (Masuk)
  Future<bool> clockIn() async {
    bool isOnline = await _isConnected();

    if (isOnline) {
      try {
        final token = await _authService.getToken();
        if (token == null) throw Exception('Unauthorized');

        final response = await _apiClient.dio.post(
          '/attendance/clock-in',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );

        return response.statusCode == 201;
      } on DioException catch (e) {
        // Fallback if network issue or unknown error (likely network related if checked online but failed)
        if (e.type == DioExceptionType.connectionError ||
            e.error is SocketException ||
            e.type == DioExceptionType.unknown) {
          return await _saveLocalAttendance('IN');
        }

        if (e.response?.statusCode == 400) {
          throw Exception(e.response?.data['message'] ?? 'Already clocked in');
        }
        throw Exception('Failed to clock in: ${e.message}');
      } catch (e) {
        // Generic fallback for other potential network-like errors
        if (e is SocketException) {
          return await _saveLocalAttendance('IN');
        }
        rethrow;
      }
    } else {
      return await _saveLocalAttendance('IN');
    }
  }

  /// Clock Out (Keluar)
  Future<bool> clockOut() async {
    bool isOnline = await _isConnected();

    if (isOnline) {
      try {
        final token = await _authService.getToken();
        if (token == null) throw Exception('Unauthorized');

        final response = await _apiClient.dio.post(
          '/attendance/clock-out',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );

        return response.statusCode == 200;
      } on DioException catch (e) {
        // Fallback if network issue
        if (e.type == DioExceptionType.connectionError ||
            e.error is SocketException ||
            e.type == DioExceptionType.unknown) {
          return await _saveLocalAttendance('OUT');
        }

        if (e.response?.statusCode == 404) {
          throw Exception('Belum absen masuk hari ini');
        }
        throw Exception('Failed to clock out: ${e.message}');
      } catch (e) {
        if (e is SocketException) {
          return await _saveLocalAttendance('OUT');
        }
        rethrow;
      }
    } else {
      return await _saveLocalAttendance('OUT');
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
    AttendanceModel? remoteToday;

    // 1. Try API if online
    if (await _isConnected()) {
      try {
        final history = await getHistory();
        if (history.isNotEmpty) {
          final lastRecord = history.first; // Assuming sorted desc from API

          final today = DateTime.now();
          final recordDate = lastRecord.date.toLocal();

          final isToday =
              recordDate.year == today.year &&
              recordDate.month == today.month &&
              recordDate.day == today.day;

          if (isToday) {
            remoteToday = lastRecord;
          }
        }
      } catch (e) {
        // Ignore API error, will fallback to local check
      }
    }

    // 2. Check Local DB
    final todayStart = DateTime.now().copyWith(
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
    );
    final todayEnd = todayStart.add(const Duration(days: 1));

    // requires Isar generated code to use filter()
    final localRecords = await _localDbService.isar.localAttendances
        .filter()
        .timestampBetween(todayStart, todayEnd)
        .sortByTimestamp()
        .findAll();

    if (localRecords.isEmpty) {
      return remoteToday;
    }

    // 3. Merge / Override with Local Data
    // If local records exist, they take precedence for the latest state.

    int id = remoteToday?.id ?? 0;
    int userId = remoteToday?.userId ?? 0;
    int branchId = remoteToday?.branchId ?? 0;
    DateTime date = remoteToday?.date ?? DateTime.now();
    DateTime clockIn = remoteToday?.clockIn ?? DateTime.now();
    DateTime? clockOut = remoteToday?.clockOut;

    bool hasBaseClockIn = remoteToday != null;
    bool hasLocalClockIn = false;

    for (var rec in localRecords) {
      if (rec.type == 'IN') {
        clockIn = rec.timestamp;
        hasLocalClockIn = true;
        // If we have a local IN, we reset clockOut if it was from a previous session (logic depends on business rule)
        // Assuming simple flow: IN -> OUT. New IN implies new session or overwrite.
        // If we have local IN, usually clockOut should be null unless there is a subsequent OUT.
        // However, if we overlay on remoteToday which might have clockOut...
        // Let's assume strictly ordered events replay.
        clockOut = null;
      } else if (rec.type == 'OUT') {
        clockOut = rec.timestamp;
      }
    }

    // If we rely purely on local 'IN' but there was none (only OUT?), revert to remote clockIn or fallback
    if (!hasLocalClockIn && !hasBaseClockIn) {
      // Only local OUT exists?
      // This is an edge case. Maybe we just use the OUT timestamp as IN as well to avoid crash?
      clockIn = clockOut ?? DateTime.now();
    }

    // Check if the latest action was local and not synced
    bool isSynced = true;
    if (localRecords.isNotEmpty) {
      // If we have any local records for today that are NOT synced, then the status is effectively "Offline" (not synced)
      // Or we can check if the *latest* relevant action is synced.
      // Let's go with: if ANY local record contributing to today's state is not synced, mark model as not synced.
      final hasUnsynced = localRecords.any((r) => !r.isSynced);
      if (hasUnsynced) {
        isSynced = false;
      }
    }

    return AttendanceModel(
      id: id,
      userId: userId,
      branchId: branchId,
      date: date,
      clockIn: clockIn,
      clockOut: clockOut,
      correctionNote: remoteToday?.correctionNote,
      isSynced: isSynced,
    );
  }

  /// Get unsynced count
  Future<int> getUnsyncedCount() async {
    return _localDbService.isar.localAttendances
        .filter()
        .isSyncedEqualTo(false)
        .count();
  }

  /// Sync offline attendance
  Future<SyncResult> syncOfflineAttendance() async {
    final unsynced = await _localDbService.isar.localAttendances
        .filter()
        .isSyncedEqualTo(false)
        .sortByTimestamp() // Process oldest first
        .findAll();

    print('DEBUG: Found ${unsynced.length} unsynced attendance records.');

    int successCount = 0;
    int failCount = 0;

    for (var record in unsynced) {
      print(
        'DEBUG: Processing record ID: ${record.id}, Type: ${record.type}, Time: ${record.timestamp}',
      );

      try {
        final token = await _authService.getToken();
        if (token == null) {
          print('DEBUG: Token is null. Aborting sync for this record.');
          throw Exception('Unauthorized');
        }

        final endpoint = record.type == 'IN'
            ? '/attendance/clock-in'
            : '/attendance/clock-out';
        final payload = {
          'offlineTimestamp': record.timestamp.toIso8601String(),
        };

        print('DEBUG: Sending POST to $endpoint');
        print('SYNC PAYLOAD: $payload');
        print('DEBUG: Payload: $payload');

        final response = await _apiClient.dio.post(
          endpoint,
          data: payload,
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );

        print('DEBUG: Response Status: ${response.statusCode}');
        print('DEBUG: Response Data: ${response.data}');

        if (response.statusCode == 200 || response.statusCode == 201) {
          await _markAsSynced(record);
          print('DEBUG: Record marked as synced.');
          successCount++;
        } else {
          print('DEBUG: Failed to sync. Status code not 200/201.');
          failCount++;
        }
      } catch (e) {
        bool handled = false;
        if (e is DioException) {
          print('SYNC ERROR DATA: ${e.response?.data}');
          print('SYNC ERROR STATUS: ${e.response?.statusCode}');

          // Handle 'Already clocked in' (Duplicate) or Conflict (409) as Success
          final statusCode = e.response?.statusCode;
          final msg =
              e.response?.data['message']?.toString().toLowerCase() ?? '';

          if (statusCode == 409 ||
              (statusCode == 400 && msg.contains('already clocked in'))) {
            print(
              'DEBUG: Duplicate/Conflict detected ($statusCode). Marking as synced.',
            );
            await _markAsSynced(record);
            successCount++;
            handled = true;
          }
        }

        if (!handled) {
          print('SYNC ERROR: $e');
          failCount++;
          // We continue the loop to try syncing other records
        }
      }
    }

    print('DEBUG: Sync completed. Success: $successCount, Failed: $failCount');
    return SyncResult(success: successCount, failed: failCount);
  }

  Future<void> _markAsSynced(LocalAttendance record) async {
    record.isSynced = true;
    await _localDbService.isar.writeTxn(() async {
      await _localDbService.isar.localAttendances.put(record);
    });
  }

  /// Clear Local Attendance (Debug purposes)
  Future<void> clearLocalAttendance() async {
    await _localDbService.isar.writeTxn(() async {
      await _localDbService.isar.localAttendances.clear();
    });
  }
}

class SyncResult {
  final int success;
  final int failed;

  SyncResult({required this.success, required this.failed});
}
