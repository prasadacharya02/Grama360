import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'app/locale_controller.dart';
import 'core/config/runtime_config.dart';
import 'core/firebase/firebase_setup_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final preferences = await SharedPreferences.getInstance();
  final savedLanguageCode = preferences.getString('language_code');

  var firebaseReady = false;
  final firebaseOptions = RuntimeConfig.firebaseOptions;
  if (firebaseOptions != null) {
    try {
      await Firebase.initializeApp(options: firebaseOptions);
      firebaseReady = true;
    } catch (_) {
      // The app remains on a localized setup screen; never log configuration data.
    }
  }

  runApp(
    ProviderScope(
      overrides: [
        initialLocaleCodeProvider.overrideWith((ref) => savedLanguageCode),
        firebaseReadyProvider.overrideWith((ref) => firebaseReady),
      ],
      child: const Grama360App(),
    ),
  );
}
