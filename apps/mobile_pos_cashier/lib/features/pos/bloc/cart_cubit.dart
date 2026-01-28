import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';

// ============================================================================
// CartItem Model
// ============================================================================

/// Represents an item in the shopping cart.
class CartItem extends Equatable {
  final LocalProduct product;
  final int quantity;
  final double subtotal;

  const CartItem({
    required this.product,
    required this.quantity,
    required this.subtotal,
  });

  /// Creates a copy of this CartItem with the given fields replaced.
  CartItem copyWith({LocalProduct? product, int? quantity, double? subtotal}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      subtotal: subtotal ?? this.subtotal,
    );
  }

  @override
  List<Object?> get props => [product, quantity, subtotal];
}

// ============================================================================
// CartState
// ============================================================================

/// State class for CartCubit containing cart items and totals.
class CartState extends Equatable {
  final List<CartItem> items;
  final double totalAmount;
  final int totalQty;

  const CartState({
    this.items = const [],
    this.totalAmount = 0.0,
    this.totalQty = 0,
  });

  /// Creates a copy of this CartState with the given fields replaced.
  CartState copyWith({
    List<CartItem>? items,
    double? totalAmount,
    int? totalQty,
  }) {
    return CartState(
      items: items ?? this.items,
      totalAmount: totalAmount ?? this.totalAmount,
      totalQty: totalQty ?? this.totalQty,
    );
  }

  @override
  List<Object?> get props => [items, totalAmount, totalQty];
}

// ============================================================================
// CartCubit
// ============================================================================

/// Cubit for managing shopping cart operations.
class CartCubit extends Cubit<CartState> {
  CartCubit() : super(const CartState());

  /// Adds a product to the cart.
  /// If the product already exists, increments the quantity.
  /// Otherwise, adds a new CartItem.
  void addToCart(LocalProduct product) {
    final existingIndex = state.items.indexWhere(
      (item) => item.product.serverId == product.serverId,
    );

    List<CartItem> updatedItems;

    if (existingIndex != -1) {
      // Product exists, increment quantity
      updatedItems = List.from(state.items);
      final existingItem = updatedItems[existingIndex];
      final newQty = existingItem.quantity + 1;
      updatedItems[existingIndex] = existingItem.copyWith(
        quantity: newQty,
        subtotal: product.price * newQty,
      );
    } else {
      // New product, add to cart
      updatedItems = [
        ...state.items,
        CartItem(product: product, quantity: 1, subtotal: product.price),
      ];
    }

    emit(state.copyWith(items: updatedItems));
    _calculateTotal();
  }

  /// Removes a product from the cart by its product server ID.
  void removeFromCart(int productId) {
    final updatedItems = state.items
        .where((item) => item.product.serverId != productId)
        .toList();

    emit(state.copyWith(items: updatedItems));
    _calculateTotal();
  }

  /// Clears all items from the cart and resets totals.
  void clearCart() {
    emit(const CartState());
  }

  /// Calculates and updates the total amount and quantity.
  void _calculateTotal() {
    double totalAmount = 0.0;
    int totalQty = 0;

    for (final item in state.items) {
      totalAmount += item.subtotal;
      totalQty += item.quantity;
    }

    emit(state.copyWith(totalAmount: totalAmount, totalQty: totalQty));
  }

  /// Public method to recalculate totals if needed externally.
  void calculateTotal() => _calculateTotal();
}
