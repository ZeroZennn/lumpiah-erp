import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiClient {
  // Singleton pattern
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio _dio;

  ApiClient._internal() {
    // Tentukan Base URL
    // Android Emulator TIDAK BISA pakai 'localhost'. Harus '10.0.2.2'.
    // Jika pakai HP Fisik, ganti dengan IP Laptop (misal: '192.168.1.5')

    // Prioritas 1: Ambil dari .env (bisa IP Laptop 192.168.x.x atau apapun)
    String? envBaseUrl = dotenv.env['BASE_URL'];

    String baseUrl;
    if (envBaseUrl != null && envBaseUrl.isNotEmpty) {
      baseUrl = envBaseUrl;
    } else {
      // Prioritas 2: Default Fallback (Emulator = 10.0.2.2, Lainnya = localhost)
      baseUrl = Platform.isAndroid
          ? 'http://10.0.2.2:4000'
          : 'http://localhost:4000';
    }

    BaseOptions options = BaseOptions(
      baseUrl: baseUrl,
      // KITA NAIKKAN JADI 15 DETIK (Saran Error tadi)
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    _dio = Dio(options);

    // Tambahkan Log agar kita tahu apa yang terjadi (PENTING BUAT DEBUG)
    _dio.interceptors.add(
      LogInterceptor(
        request: true,
        requestBody: true,
        responseBody: true,
        error: true,
      ),
    );
  }

  Dio get dio => _dio;
}
