import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_transaction.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_attendance.dart';

class LocalDbService {
  // Singleton instance
  static final LocalDbService _instance = LocalDbService._internal();

  factory LocalDbService() {
    return _instance;
  }

  LocalDbService._internal();

  late Isar _isar;

  /// Global access to the Isar instance
  Isar get isar => _isar;

  /// Initialize Isar
  Future<void> init() async {
    final dir = await getApplicationDocumentsDirectory();
    _isar = await Isar.open([
      LocalProductSchema,
      LocalTransactionSchema,
      LocalAttendanceSchema,
    ], directory: dir.path);
  }
}
