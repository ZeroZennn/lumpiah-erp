import 'package:isar/isar.dart';

part 'local_attendance.g.dart';

@collection
class LocalAttendance {
  Id id = Isar.autoIncrement;

  late String type; // 'IN' or 'OUT'

  late DateTime timestamp;

  bool isSynced = false;

  String? notes;
}
