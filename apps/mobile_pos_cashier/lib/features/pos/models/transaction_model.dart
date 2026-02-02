class TransactionModel {
  final String? id;
  final String branchName;
  final DateTime date;
  final double totalAmount;
  final String paymentMethod;
  final double? cashReceived;
  final double? change;
  final List<TransactionItem> items;

  TransactionModel({
    this.id,
    required this.branchName,
    required this.date,
    required this.totalAmount,
    required this.paymentMethod,
    this.cashReceived,
    this.change,
    required this.items,
  });

  factory TransactionModel.fromMap(Map<String, dynamic> map) {
    return TransactionModel(
      id: map['id'] ?? map['transactionId'],
      branchName: map['branchName'] ?? 'Cabang Utama',
      date: map['date'] != null
          ? (map['date'] is DateTime
                ? map['date']
                : DateTime.tryParse(map['date'].toString()) ?? DateTime.now())
          : DateTime.now(),
      totalAmount: (map['totalAmount'] ?? 0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'CASH',
      cashReceived: map['cashReceived']?.toDouble(),
      change: map['change']?.toDouble(),
      items:
          (map['items'] as List<dynamic>?)
              ?.map((x) => TransactionItem.fromMap(x))
              .toList() ??
          [],
    );
  }
}

class TransactionItem {
  final String name;
  final int quantity;
  final double price;

  TransactionItem({
    required this.name,
    required this.quantity,
    required this.price,
  });

  factory TransactionItem.fromMap(Map<String, dynamic> map) {
    return TransactionItem(
      name: map['productName'] ?? map['name'] ?? 'Unknown',
      quantity: (map['quantity'] ?? 0).toInt(),
      price: (map['price'] ?? 0).toDouble(),
    );
  }

  double get total => quantity * price;
}
