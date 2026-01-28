import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:intl/intl.dart';

/// High-fidelity Modern Tablet POS Screen
/// Layout: Left (Product Catalog - Flex 7) | Right (Cart Panel - Flex 3)
class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  String _selectedCategory = 'Semua';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // Category list
  final List<String> _categories = ['Semua', 'Lumpia', 'Minuman', 'Paket'];

  // Mock products data
  static List<LocalProduct> get _mockProducts {
    return [
      LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs',
      LocalProduct()
        ..serverId = 2
        ..name = 'Lumpia Udang'
        ..category = 'Lumpia'
        ..price = 7000
        ..unit = 'pcs',
      LocalProduct()
        ..serverId = 3
        ..name = 'Lumpia Sayur'
        ..category = 'Lumpia'
        ..price = 4000
        ..unit = 'pcs',
      LocalProduct()
        ..serverId = 4
        ..name = 'Es Teh Manis'
        ..category = 'Minuman'
        ..price = 5000
        ..unit = 'gelas',
      LocalProduct()
        ..serverId = 5
        ..name = 'Es Jeruk'
        ..category = 'Minuman'
        ..price = 6000
        ..unit = 'gelas',
      LocalProduct()
        ..serverId = 6
        ..name = 'Kopi Hitam'
        ..category = 'Minuman'
        ..price = 5000
        ..unit = 'gelas',
      LocalProduct()
        ..serverId = 7
        ..name = 'Lumpia Spesial'
        ..category = 'Lumpia'
        ..price = 10000
        ..unit = 'pcs',
      LocalProduct()
        ..serverId = 8
        ..name = 'Paket Hemat A'
        ..category = 'Paket'
        ..price = 15000
        ..unit = 'paket',
      LocalProduct()
        ..serverId = 9
        ..name = 'Paket Hemat B'
        ..category = 'Paket'
        ..price = 20000
        ..unit = 'paket',
    ];
  }

  List<LocalProduct> get _filteredProducts {
    return _mockProducts.where((product) {
      final matchesCategory =
          _selectedCategory == 'Semua' || product.category == _selectedCategory;
      final matchesSearch = product.name.toLowerCase().contains(
        _searchQuery.toLowerCase(),
      );
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            // ============================================================
            // LEFT SIDE - Product Catalog (Flex 7)
            // ============================================================
            Expanded(flex: 7, child: _buildProductCatalog()),

            // ============================================================
            // RIGHT SIDE - Cart Panel (Flex 3)
            // ============================================================
            Expanded(flex: 3, child: _buildCartPanel()),
          ],
        ),
      ),
    );
  }

  // ============================================================================
  // Product Catalog Section
  // ============================================================================
  Widget _buildProductCatalog() {
    return Container(
      color: const Color(0xFFF5F5F5),
      child: Column(
        children: [
          // Header with search and categories
          _buildCatalogHeader(),
          // Product Grid
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 12, 20),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  childAspectRatio: 0.85,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: _filteredProducts.length,
                itemBuilder: (context, index) {
                  return _ProductCard(product: _filteredProducts[index]);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title and Search Row
          Row(
            children: [
              const Text(
                'Menu',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D2D2D),
                ),
              ),
              const SizedBox(width: 24),
              // Search Bar
              Expanded(
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(15),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _searchQuery = value),
                    decoration: InputDecoration(
                      hintText: 'Cari produk...',
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 20),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Category Chips
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: EdgeInsets.only(right: 12, left: index == 0 ? 0 : 0),
                  child: _CategoryChip(
                    label: category,
                    isSelected: isSelected,
                    onTap: () => setState(() => _selectedCategory = category),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // Cart Panel Section
  // ============================================================================
  Widget _buildCartPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 20,
            offset: const Offset(-4, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          // Cart Header
          _buildCartHeader(),
          // Cart Items List
          Expanded(child: _buildCartItems()),
          // Cart Footer with totals and checkout
          _buildCartFooter(),
        ],
      ),
    );
  }

  Widget _buildCartHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Current Order',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
          ),
          BlocBuilder<CartCubit, CartState>(
            builder: (context, state) {
              if (state.items.isEmpty) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () {
                  context.read<CartCubit>().clearCart();
                },
                icon: const Icon(Icons.delete_outline, size: 18),
                label: const Text('Clear'),
                style: TextButton.styleFrom(foregroundColor: Colors.red[400]),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCartItems() {
    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        if (state.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.shopping_basket_outlined,
                  size: 80,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 16),
                Text(
                  'Keranjang kosong',
                  style: TextStyle(fontSize: 16, color: Colors.grey[400]),
                ),
                const SizedBox(height: 8),
                Text(
                  'Pilih produk untuk memulai',
                  style: TextStyle(fontSize: 14, color: Colors.grey[400]),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: state.items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            return _CartItemTile(item: state.items[index]);
          },
        );
      },
    );
  }

  Widget _buildCartFooter() {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        final subtotal = state.totalAmount;
        final tax = subtotal * 0.1; // 10% tax
        final total = subtotal + tax;

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(15),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Summary rows
              _buildSummaryRow('Subtotal', formatter.format(subtotal)),
              const SizedBox(height: 8),
              _buildSummaryRow('Tax (10%)', formatter.format(tax)),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(),
              ),
              // Total row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D2D2D),
                    ),
                  ),
                  Text(
                    formatter.format(total),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFFB300),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Checkout Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: state.items.isEmpty
                      ? null
                      : () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Processing payment: ${formatter.format(total)}',
                              ),
                              backgroundColor: const Color(0xFFFFB300),
                            ),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB300),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    state.items.isEmpty
                        ? 'Select Items'
                        : 'Charge - ${formatter.format(total)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF2D2D2D),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// Category Chip Widget
// ============================================================================
class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? const Color(0xFFFFB300) : Colors.white,
      borderRadius: BorderRadius.circular(22),
      elevation: isSelected ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isSelected ? Colors.transparent : Colors.grey[300]!,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.grey[600],
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Product Card Widget
// ============================================================================
class _ProductCard extends StatelessWidget {
  final LocalProduct product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Card(
      elevation: 2,
      shadowColor: Colors.black.withAlpha(20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => context.read<CartCubit>().addToCart(product),
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Image Placeholder
                  Expanded(
                    child: Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8E1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(
                          _getCategoryIcon(product.category),
                          size: 40,
                          color: const Color(0xFFFFB300),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Product Name
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D2D2D),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Price
                  Text(
                    formatter.format(product.price),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFFB300),
                    ),
                  ),
                ],
              ),
            ),
            // Add Button
            Positioned(
              right: 8,
              bottom: 8,
              child: Material(
                color: const Color(0xFFFFB300),
                borderRadius: BorderRadius.circular(24),
                elevation: 2,
                child: InkWell(
                  onTap: () {
                    context.read<CartCubit>().addToCart(product);
                    // Clear existing snackbars to prevent GlobalKey conflict
                    ScaffoldMessenger.of(context).clearSnackBars();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${product.name} added'),
                        duration: const Duration(milliseconds: 500),
                        behavior: SnackBarBehavior.floating,
                        margin: const EdgeInsets.all(16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(24),
                  child: const SizedBox(
                    width: 40,
                    height: 40,
                    child: Icon(Icons.add, color: Colors.white, size: 22),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'lumpia':
        return Icons.restaurant;
      case 'minuman':
        return Icons.local_cafe;
      case 'paket':
        return Icons.lunch_dining;
      default:
        return Icons.fastfood;
    }
  }
}

// ============================================================================
// Cart Item Tile Widget
// ============================================================================
class _CartItemTile extends StatelessWidget {
  final CartItem item;

  const _CartItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Product Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.restaurant,
              color: Color(0xFFFFB300),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          // Product Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D2D2D),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  formatter.format(item.subtotal),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFFFB300),
                  ),
                ),
              ],
            ),
          ),
          // Quantity Controls
          Row(
            children: [
              // Decrease Button
              _QuantityButton(
                icon: Icons.remove,
                onTap: () {
                  if (item.quantity > 1) {
                    // TODO: Implement decrease quantity
                  } else {
                    context.read<CartCubit>().removeFromCart(
                      item.product.serverId,
                    );
                  }
                },
              ),
              // Quantity Display
              Container(
                width: 36,
                alignment: Alignment.center,
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
              ),
              // Increase Button
              _QuantityButton(
                icon: Icons.add,
                isPrimary: true,
                onTap: () {
                  context.read<CartCubit>().addToCart(item.product);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Quantity Button Widget
// ============================================================================
class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isPrimary ? const Color(0xFFFFB300) : Colors.grey[200],
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(
            icon,
            size: 18,
            color: isPrimary ? Colors.white : Colors.grey[600],
          ),
        ),
      ),
    );
  }
}
