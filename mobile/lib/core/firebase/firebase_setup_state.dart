import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Set after Firebase.initializeApp succeeds. Defaults to false for tests and
/// for local runs that have not supplied Firebase project configuration.
final firebaseReadyProvider = Provider<bool>((ref) => false);
