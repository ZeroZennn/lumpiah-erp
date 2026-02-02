import 'package:isar/isar.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_transaction.dart';

/// Repository class for handling local POS data operations using Isar database.
class PosRepository {
  final Isar _isar;

  PosRepository(this._isar);

  /// Fetches all products from the local Isar database.
  /// Returns a list of all [LocalProduct] entries.
  Future<List<LocalProduct>> getAllProducts() async {
    return await _isar.localProducts.where().findAll();
  }

  /// Saves a transaction to the local Isar database.
  ///
  /// [trx] - The transaction to be saved.
  /// Returns the ID of the saved transaction.
  Future<int> saveTransaction(LocalTransaction trx) async {
    return await _isar.writeTxn(() async {
      return await _isar.localTransactions.put(trx);
    });
  }

  /// Fetches all unsynced transactions.
  Future<List<LocalTransaction>> getUnsyncedTransactions() async {
    return await _isar.localTransactions
        .filter()
        .isSyncedEqualTo(false)
        .findAll();
  }
}
