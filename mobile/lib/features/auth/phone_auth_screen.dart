import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../admin/admin_sign_in_screen.dart';
import 'auth_providers.dart';

class PhoneAuthScreen extends ConsumerStatefulWidget {
  const PhoneAuthScreen({super.key});

  @override
  ConsumerState<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends ConsumerState<PhoneAuthScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();

  String? _verificationId;
  int? _resendToken;
  bool _codeSent = false;
  bool _busy = false;
  bool _signInStarted = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _requestCode({int? forceResendingToken}) async {
    final strings = AppLocalizations.of(context);
    final digits = _phoneController.text.trim();
    if (!RegExp(r'^[6-9][0-9]{9}$').hasMatch(digits)) {
      setState(() => _errorMessage = strings.authPhoneInvalid);
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      await ref.read(firebaseAuthProvider).verifyPhoneNumber(
            phoneNumber: '+91$digits',
            timeout: const Duration(seconds: 60),
            forceResendingToken: forceResendingToken,
            verificationCompleted: (credential) {
              unawaited(_signInWithCredential(credential));
            },
            verificationFailed: (exception) {
              if (!mounted) return;
              setState(() {
                _busy = false;
                _errorMessage = _friendlyAuthError(strings, exception);
              });
            },
            codeSent: (verificationId, resendToken) {
              if (!mounted) return;
              setState(() {
                _verificationId = verificationId;
                _resendToken = resendToken;
                _codeSent = true;
                _busy = false;
                _errorMessage = null;
              });
            },
            codeAutoRetrievalTimeout: (verificationId) {
              _verificationId = verificationId;
            },
          );
    } on FirebaseAuthException catch (exception) {
      if (mounted) setState(() => _errorMessage = _friendlyAuthError(strings, exception));
    } catch (_) {
      if (mounted) setState(() => _errorMessage = strings.authNetworkError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyCode() async {
    final strings = AppLocalizations.of(context);
    final verificationId = _verificationId;
    final code = _codeController.text.trim();
    if (verificationId == null || !RegExp(r'^[0-9]{6}$').hasMatch(code)) {
      setState(() => _errorMessage = strings.authCodeInvalid);
      return;
    }

    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: code,
    );
    await _signInWithCredential(credential);
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    if (_signInStarted || !mounted) return;
    _signInStarted = true;
    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      await ref.read(firebaseAuthProvider).signInWithCredential(credential);
      // AppStartScreen observes FirebaseAuth.authStateChanges and continues to
      // the server session/role flow. No user ID or phone is accepted from UI state.
    } on FirebaseAuthException catch (exception) {
      if (mounted) {
        setState(() => _errorMessage = _friendlyAuthError(
              AppLocalizations.of(context),
              exception,
            ));
      }
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = AppLocalizations.of(context).authNetworkError);
      }
    } finally {
      _signInStarted = false;
      if (mounted) setState(() => _busy = false);
    }
  }

  void _changePhoneNumber() {
    setState(() {
      _codeSent = false;
      _verificationId = null;
      _resendToken = null;
      _codeController.clear();
      _errorMessage = null;
    });
  }

  String _friendlyAuthError(
    AppLocalizations strings,
    FirebaseAuthException exception,
  ) {
    switch (exception.code) {
      case 'invalid-phone-number':
        return strings.authPhoneInvalid;
      case 'invalid-verification-code':
      case 'session-expired':
        return strings.authCodeWrongOrExpired;
      case 'too-many-requests':
      case 'quota-exceeded':
        return strings.authTooManyRequests;
      case 'network-request-failed':
        return strings.authNetworkError;
      default:
        return strings.authGenericError;
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.appTitle),
        actions: const [LanguageAction()],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.phone_android_rounded,
                    size: 64,
                    color: Color(0xFF245B43),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    strings.authTitle,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    strings.authHelper,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 28),
                  if (!_codeSent) ...[
                    TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: strings.phoneNumberLabel,
                        hintText: strings.phoneNumberHint,
                        prefixText: '+91 ',
                        helperText: strings.phoneNumberHelper,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _busy ? null : () => _requestCode(),
                      icon: _busy
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.sms_outlined),
                      label: Text(_busy ? strings.sendingOtp : strings.sendOtp),
                    ),
                  ] else ...[
                    Text(
                      strings.otpSentMessage(_phoneController.text.trim()),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 18),
                    TextField(
                      controller: _codeController,
                      keyboardType: TextInputType.number,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      maxLength: 6,
                      autofocus: true,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onSubmitted: (_) {
                        if (!_busy) unawaited(_verifyCode());
                      },
                      decoration: InputDecoration(
                        labelText: strings.otpLabel,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _busy ? null : _verifyCode,
                      child: _busy
                          ? const SizedBox.square(
                              dimension: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(strings.verifyOtp),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _busy ? null : () => _requestCode(forceResendingToken: _resendToken),
                      child: Text(strings.resendOtp),
                    ),
                    TextButton(
                      onPressed: _busy ? null : _changePhoneNumber,
                      child: Text(strings.changePhoneNumber),
                    ),
                  ],
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Semantics(
                      liveRegion: true,
                      child: Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: _busy
                        ? null
                        : () => Navigator.of(context).push<void>(
                              MaterialPageRoute<void>(
                                builder: (_) => const AdminSignInScreen(),
                              ),
                            ),
                    icon: const Icon(Icons.admin_panel_settings_outlined),
                    label: Text(strings.adminSignIn),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
