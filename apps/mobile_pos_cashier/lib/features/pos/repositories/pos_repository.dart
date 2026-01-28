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

  /// Saves a transaction to the local Isar database synchronously.
  ///
  /// [trx] - The transaction to be saved.
  /// Returns the ID of the saved transaction.
  Future<int> saveTransaction(LocalTransaction trx) async {
    return await _isar.writeTxn(() async {
      // Save all transaction items first
      for (final item in trx.items) {
        await _isar.localTransactionItems.put(item);
      }

      // Save the transaction and persist the links
      final id = await _isar.localTransactions.put(trx);
      await trx.items.save();

      return id;
    });
  }

  /// Fetches all transactions with 'DRAFT' status from the local database.
  /// Returns a list of [LocalTransaction] with status == 'DRAFT'.
  Future<List<LocalTransaction>> getDraftTransactions() async {
    return await _isar.localTransactions
        .filter()
        .statusEqualTo('DRAFT')
        .findAll();
  }
}
