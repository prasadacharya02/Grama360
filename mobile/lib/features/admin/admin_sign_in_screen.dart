import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_providers.dart';
import 'admin_models.dart';
import 'admin_providers.dart';

/// Staff sign-in uses an email/password primary factor and Firebase phone MFA.
/// Admin users are created and enrolled out of band, never by public signup.
class AdminSignInScreen extends ConsumerStatefulWidget {
  const AdminSignInScreen({super.key});

  @override
  ConsumerState<AdminSignInScreen> createState() => _AdminSignInScreenState();
}

class _AdminSignInScreenState extends ConsumerState<AdminSignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();

  MultiFactorResolver? _resolver;
  int? _resendToken;
  String? _verificationId;
  String? _maskedPhone;
  String? _errorMessage;
  bool _codeSent = false;
  bool _busy = false;
  bool _finishingSignIn = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    final strings = AppLocalizations.of(context);
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = strings.adminSignInFieldsRequired);
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(firebaseAuthProvider).signInWithEmailAndPassword(
            email: email,
            password: password,
          );
      await _verifyAdminSession();
    } on FirebaseAuthMultiFactorException catch (exception) {
      await _startMfaChallenge(exception.resolver);
    } on AdminMfaRequiredException catch (_) {
      await ref.read(authRepositoryProvider).signOut();
      if (mounted) setState(() => _errorMessage = strings.adminMfaNotEnrolled);
    } on FirebaseAuthException catch (exception) {
      if (mounted) setState(() => _errorMessage = _firebaseError(strings, exception));
    } catch (_) {
      if (mounted) setState(() => _errorMessage = strings.adminSignInError);
    } finally {
      _passwordController.clear();
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _startMfaChallenge(MultiFactorResolver resolver) async {
    final strings = AppLocalizations.of(context);
    PhoneMultiFactorInfo? phoneFactor;
    for (final hint in resolver.hints) {
      if (hint is PhoneMultiFactorInfo) {
        phoneFactor = hint;
        break;
      }
    }
    if (phoneFactor == null) {
      if (mounted) setState(() => _errorMessage = strings.adminMfaPhoneUnavailable);
      return;
    }

    _resolver = resolver;
    _maskedPhone = phoneFactor.phoneNumber;
    await _sendMfaCode(phoneFactor);
  }

  Future<void> _sendMfaCode(
    PhoneMultiFactorInfo phoneFactor, {
    int? forceResendingToken,
  }) async {
    final strings = AppLocalizations.of(context);
    final resolver = _resolver;
    if (resolver == null) return;

    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(firebaseAuthProvider).verifyPhoneNumber(
            multiFactorSession: resolver.session,
            multiFactorInfo: phoneFactor,
            timeout: const Duration(seconds: 60),
            forceResendingToken: forceResendingToken,
            verificationCompleted: (credential) {
              unawaited(_completeMfaSignIn(resolver, credential));
            },
            verificationFailed: (exception) {
              if (mounted) {
                setState(() => _errorMessage = _firebaseError(strings, exception));
              }
            },
            codeSent: (verificationId, resendToken) {
              if (!mounted) return;
              setState(() {
                _verificationId = verificationId;
                _resendToken = resendToken;
                _codeSent = true;
                _errorMessage = null;
              });
            },
            codeAutoRetrievalTimeout: (verificationId) {
              _verificationId = verificationId;
            },
          );
    } on FirebaseAuthException catch (exception) {
      if (mounted) setState(() => _errorMessage = _firebaseError(strings, exception));
    } catch (_) {
      if (mounted) setState(() => _errorMessage = strings.authNetworkError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyMfaCode() async {
    final strings = AppLocalizations.of(context);
    final resolver = _resolver;
    final verificationId = _verificationId;
    final code = _codeController.text.trim();
    if (resolver == null || verificationId == null ||
        !RegExp(r'^[0-9]{6}$').hasMatch(code)) {
      setState(() => _errorMessage = strings.authCodeInvalid);
      return;
    }

    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: code,
    );
    await _completeMfaSignIn(resolver, credential);
  }

  Future<void> _completeMfaSignIn(
    MultiFactorResolver resolver,
    PhoneAuthCredential credential,
  ) async {
    final strings = AppLocalizations.of(context);
    if (_finishingSignIn || !mounted) return;
    _finishingSignIn = true;
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await resolver.resolveSignIn(PhoneMultiFactorGenerator.getAssertion(credential));
      await _verifyAdminSession();
    } on FirebaseAuthException catch (exception) {
      if (mounted) setState(() => _errorMessage = _firebaseError(strings, exception));
    } on AdminMfaRequiredException catch (_) {
      await ref.read(authRepositoryProvider).signOut();
      if (mounted) setState(() => _errorMessage = strings.adminMfaReauthRequired);
    } catch (_) {
      if (mounted) setState(() => _errorMessage = strings.adminSignInError);
    } finally {
      _finishingSignIn = false;
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyAdminSession() async {
    final user = ref.read(firebaseAuthProvider).currentUser;
    if (user == null) throw StateError('No Firebase user after sign-in.');
    await user.getIdToken(true);
    final access = await ref.read(adminRepositoryProvider).loadCurrentAccess();
    if (access == null) {
      await ref.read(authRepositoryProvider).signOut();
      if (mounted) {
        setState(() => _errorMessage = AppLocalizations.of(context).adminAccessDenied);
      }
      return;
    }
    if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
  }

  String _firebaseError(AppLocalizations strings, FirebaseAuthException exception) {
    switch (exception.code) {
      case 'invalid-email':
        return strings.adminEmailInvalid;
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return strings.adminCredentialsInvalid;
      case 'invalid-verification-code':
      case 'session-expired':
        return strings.authCodeWrongOrExpired;
      case 'too-many-requests':
      case 'quota-exceeded':
        return strings.authTooManyRequests;
      case 'network-request-failed':
        return strings.authNetworkError;
      default:
        return strings.adminSignInError;
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final resolver = _resolver;
    PhoneMultiFactorInfo? phoneFactor;
    if (resolver != null) {
      for (final hint in resolver.hints) {
        if (hint is PhoneMultiFactorInfo) {
          phoneFactor = hint;
          break;
        }
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.adminSignInTitle),
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
                  const Icon(Icons.admin_panel_settings_outlined, size: 64),
                  const SizedBox(height: 18),
                  Text(
                    strings.adminSignInHelper,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),
                  if (!_codeSent) ...[
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.username],
                      enabled: !_busy,
                      decoration: InputDecoration(
                        labelText: strings.adminEmailLabel,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      enabled: !_busy,
                      onSubmitted: (_) {
                        if (!_busy) unawaited(_signIn());
                      },
                      decoration: InputDecoration(
                        labelText: strings.adminPasswordLabel,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 18),
                    FilledButton.icon(
                      onPressed: _busy ? null : _signIn,
                      icon: _busy
                          ? const _SmallProgressIndicator()
                          : const Icon(Icons.lock_open_rounded),
                      label: Text(strings.adminSignInButton),
                    ),
                  ] else ...[
                    Text(
                      strings.adminMfaSent(_maskedPhone ?? ''),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _codeController,
                      keyboardType: TextInputType.number,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 6,
                      autofocus: true,
                      enabled: !_busy,
                      onSubmitted: (_) {
                        if (!_busy) unawaited(_verifyMfaCode());
                      },
                      decoration: InputDecoration(
                        labelText: strings.adminMfaCodeLabel,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: _busy ? null : _verifyMfaCode,
                      child: _busy
                          ? const _SmallProgressIndicator()
                          : Text(strings.adminMfaVerify),
                    ),
                    TextButton(
                      onPressed: _busy || phoneFactor == null
                          ? null
                          : () => _sendMfaCode(
                                phoneFactor!,
                                forceResendingToken: _resendToken,
                              ),
                      child: Text(strings.resendOtp),
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
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SmallProgressIndicator extends StatelessWidget {
  const _SmallProgressIndicator();

  @override
  Widget build(BuildContext context) => const SizedBox.square(
        dimension: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
}
