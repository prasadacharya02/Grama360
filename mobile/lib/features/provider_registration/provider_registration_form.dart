import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../app/locale_controller.dart';
import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_providers.dart';
import 'provider_models.dart';
import 'provider_providers.dart';
import 'working_hours_editor.dart';

class ProviderRegistrationForm extends ConsumerStatefulWidget {
  const ProviderRegistrationForm({
    required this.firebaseUid,
    required this.primaryPhoneNumber,
    required this.initialName,
    required this.initialProfile,
    required this.categories,
    required this.onSaved,
    super.key,
  });

  final String firebaseUid;
  final String primaryPhoneNumber;
  final String? initialName;
  final ProviderProfile? initialProfile;
  final List<ServiceCategory> categories;
  final ValueChanged<ProviderProfile> onSaved;

  @override
  ConsumerState<ProviderRegistrationForm> createState() =>
      _ProviderRegistrationFormState();
}

class _ProviderRegistrationFormState
    extends ConsumerState<ProviderRegistrationForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _businessNameController;
  late final TextEditingController _secondaryPhoneController;
  late final TextEditingController _localityController;
  late final TextEditingController _talukController;
  late final TextEditingController _districtController;
  late final TextEditingController _experienceController;
  late final TextEditingController _radiusController;
  late final TextEditingController _descriptionController;

  late final Set<String> _serviceIds;
  late final Set<String> _spokenLanguages;
  late List<ProviderWorkingHour> _workingHours;
  late String _locationLanguage;
  XFile? _selectedPhoto;
  bool _saving = false;
  bool _selectionError = false;
  bool _languageError = false;
  String? _hoursError;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    final profile = widget.initialProfile;
    _nameController = TextEditingController(
      text: profile?.displayName ?? widget.initialName?.trim() ?? '',
    );
    _businessNameController = TextEditingController(text: profile?.businessName ?? '');
    _secondaryPhoneController = TextEditingController(
      text: profile?.secondaryPhoneNumber ?? '',
    );
    _localityController = TextEditingController(text: profile?.location['locality'] ?? '');
    _talukController = TextEditingController(text: profile?.location['taluk'] ?? '');
    _districtController = TextEditingController(text: profile?.location['district'] ?? '');
    _experienceController = TextEditingController(
      text: profile?.experienceYears.toString() ?? '0',
    );
    _radiusController = TextEditingController(
      text: profile?.serviceRadiusKm.toString() ?? '10',
    );
    _descriptionController = TextEditingController(text: profile?.description ?? '');
    _serviceIds = profile?.services.map((service) => service.id).toSet() ?? {};
    _spokenLanguages = profile?.languages.toSet() ?? {'kn'};
    _workingHours = _initialWorkingHours(profile);
    _locationLanguage = profile?.location['languageCode'] ??
        ref.read(appLocaleProvider)?.languageCode ??
        'en';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _businessNameController.dispose();
    _secondaryPhoneController.dispose();
    _localityController.dispose();
    _talukController.dispose();
    _districtController.dispose();
    _experienceController.dispose();
    _radiusController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  List<ProviderWorkingHour> _initialWorkingHours(ProviderProfile? profile) {
    final existing = profile?.workingHours ?? const <ProviderWorkingHour>[];
    return List.generate(7, (weekday) {
      for (final hour in existing) {
        if (hour.weekday == weekday) return hour;
      }
      return ProviderWorkingHour(
        weekday: weekday,
        isClosed: weekday == 0,
        opensAt: weekday == 0 ? null : '09:00',
        closesAt: weekday == 0 ? null : '17:00',
      );
    }, growable: false);
  }

  void _toggleService(String id, bool selected) {
    final strings = AppLocalizations.of(context);
    setState(() {
      _selectionError = false;
      _saveError = null;
      if (selected) {
        if (_serviceIds.length >= 5) {
          _saveError = strings.providerServiceLimitError;
          return;
        }
        _serviceIds.add(id);
      } else {
        _serviceIds.remove(id);
      }
    });
  }

  void _toggleLanguage(String code, bool selected) {
    setState(() {
      _languageError = false;
      if (selected) {
        _spokenLanguages.add(code);
      } else {
        _spokenLanguages.remove(code);
      }
    });
  }

  String? _validateSecondaryPhone(String? value, AppLocalizations strings) {
    final normalized = _normalizePhone(value ?? '');
    if (normalized.isEmpty) return null;
    if (!RegExp(r'^\+[1-9][0-9]{7,14}$').hasMatch(normalized)) {
      return strings.providerInvalidPhone;
    }
    if (normalized == widget.primaryPhoneNumber) {
      return strings.providerSecondaryPhoneSame;
    }
    return null;
  }

  String _normalizePhone(String value) => value.replaceAll(RegExp(r'[\s()-]'), '');

  Future<void> _choosePhoto(AppLocalizations strings) async {
    try {
      final image = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 82,
        maxWidth: 1200,
        maxHeight: 1200,
      );
      if (image == null || !mounted) return;
      setState(() {
        _selectedPhoto = image;
        _saveError = null;
      });
    } catch (_) {
      if (mounted) setState(() => _saveError = strings.providerPhotoUploadError);
    }
  }

  Future<void> _submit(AppLocalizations strings) async {
    final isFormValid = _formKey.currentState?.validate() ?? false;
    final isHoursValid = _workingHours.length == 7 &&
        _workingHours.any((hour) => !hour.isClosed) &&
        _workingHours.every((hour) =>
            hour.isClosed ||
            (hour.opensAt != null &&
                hour.closesAt != null &&
                hour.opensAt!.compareTo(hour.closesAt!) < 0));

    setState(() {
      _selectionError = _serviceIds.isEmpty;
      _languageError = _spokenLanguages.isEmpty;
      _hoursError = isHoursValid ? null : strings.providerInvalidHours;
      _saveError = null;
    });

    if (!isFormValid ||
        _serviceIds.isEmpty ||
        _spokenLanguages.isEmpty ||
        !isHoursValid) {
      return;
    }

    final radius = double.tryParse(_radiusController.text.trim());
    final experience = int.tryParse(_experienceController.text.trim());
    if (radius == null || experience == null) return;

    setState(() => _saving = true);
    try {
      final repository = ref.read(providerRepositoryProvider);
      var photoPath = widget.initialProfile?.profilePhotoPath;
      if (_selectedPhoto != null) {
        photoPath = await repository.uploadProfilePhoto(
          widget.firebaseUid,
          _selectedPhoto!,
        );
      }

      final secondaryPhone = _normalizePhone(_secondaryPhoneController.text.trim());
      final input = <String, Object?>{
        'displayName': _nameController.text.trim(),
        'businessName': _optionalText(_businessNameController.text),
        'secondaryPhoneNumber': secondaryPhone.isEmpty ? null : secondaryPhone,
        'serviceRadiusKm': radius,
        'experienceYears': experience,
        'description': _optionalText(_descriptionController.text),
        'profilePhotoPath': photoPath,
        'serviceIds': _serviceIds.toList(growable: false),
        'languages': _spokenLanguages.toList(growable: false),
        'location': {
          'locality': _localityController.text.trim(),
          'taluk': _optionalText(_talukController.text),
          'district': _districtController.text.trim(),
          'languageCode': _locationLanguage,
        },
        'workingHours': _workingHours
            .map((hour) => hour.toJson())
            .toList(growable: false),
      };

      final profile = widget.initialProfile == null
          ? await repository.createProfile(input)
          : await repository.updateProfile(input);
      if (mounted) widget.onSaved(profile);
    } catch (_) {
      if (mounted) setState(() => _saveError = strings.providerRegistrationError);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String? _optionalText(String value) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  String? _validateName(String? value, AppLocalizations strings) =>
      value == null || value.trim().isEmpty ? strings.providerRequiredField : null;

  String? _validateExperience(String? value, AppLocalizations strings) {
    final years = int.tryParse(value?.trim() ?? '');
    if (years == null || years < 0 || years > 80) {
      return strings.providerInvalidExperience;
    }
    return null;
  }

  String? _validateRadius(String? value, AppLocalizations strings) {
    final radius = double.tryParse(value?.trim() ?? '');
    if (radius == null || !radius.isFinite || radius < 1 || radius > 200) {
      return strings.providerInvalidRadius;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final weekdayNames = [
      strings.sunday,
      strings.monday,
      strings.tuesday,
      strings.wednesday,
      strings.thursday,
      strings.friday,
      strings.saturday,
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.providerRegistrationTitle),
        actions: [
          const LanguageAction(),
          IconButton(
            tooltip: strings.signOut,
            onPressed: _saving ? null : () => ref.read(authRepositoryProvider).signOut(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Form(
              key: _formKey,
              child: AbsorbPointer(
                absorbing: _saving,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        strings.providerRegistrationIntro,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      if (widget.initialProfile?.profileStatus == 'REJECTED') ...[
                        const SizedBox(height: 16),
                        _InfoBanner(
                          icon: Icons.info_outline_rounded,
                          message: widget.initialProfile?.reviewNote == null
                              ? strings.providerRejectedBody
                              : [
                                  strings.providerRejectedBody,
                                  '',
                                  '${strings.providerReviewNoteTitle}: ${widget.initialProfile!.reviewNote}',
                                ].join('\n'),
                        ),
                      ],
                      const SizedBox(height: 22),
                      _sectionTitle(context, strings.providerContactSection),
                      const SizedBox(height: 10),
                      Card(
                        child: ListTile(
                          leading: const Icon(Icons.verified_user_outlined),
                          title: Text(strings.providerPrimaryPhoneLabel),
                          subtitle: SelectableText(widget.primaryPhoneNumber),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _nameController,
                        label: strings.providerNameLabel,
                        validator: (value) => _validateName(value, strings),
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        maxLength: 120,
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _businessNameController,
                        label: strings.providerBusinessNameLabel,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        maxLength: 120,
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _secondaryPhoneController,
                        label: strings.providerSecondaryPhoneLabel,
                        helperText: strings.providerSecondaryPhoneHint,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s()-]')),
                        ],
                        validator: (value) => _validateSecondaryPhone(value, strings),
                      ),
                      const SizedBox(height: 24),
                      _sectionTitle(context, strings.providerServicesSection),
                      const SizedBox(height: 4),
                      Text(strings.providerServicesHelper),
                      const SizedBox(height: 8),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                '${_serviceIds.length} / 5',
                                textAlign: TextAlign.end,
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                              const SizedBox(height: 4),
                              ..._serviceCategoryGroups(),
                              if (widget.categories.isEmpty)
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Text(strings.providerNoCategories),
                                ),
                              if (_selectionError)
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Text(
                                    strings.providerSelectService,
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.error,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      _sectionTitle(context, strings.providerLocationSection),
                      const SizedBox(height: 8),
                      Text(strings.providerLocationLanguageLabel),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          ChoiceChip(
                            label: Text(strings.providerLocationLanguageEnglish),
                            selected: _locationLanguage == 'en',
                            onSelected: (_) => setState(() => _locationLanguage = 'en'),
                          ),
                          ChoiceChip(
                            label: Text(strings.providerLocationLanguageKannada),
                            selected: _locationLanguage == 'kn',
                            onSelected: (_) => setState(() => _locationLanguage = 'kn'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _localityController,
                        label: strings.providerLocalityLabel,
                        validator: (value) => _validateName(value, strings),
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        maxLength: 120,
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _talukController,
                        label: strings.providerTalukLabel,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        maxLength: 120,
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _districtController,
                        label: strings.providerDistrictLabel,
                        validator: (value) => _validateName(value, strings),
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        maxLength: 120,
                      ),
                      const SizedBox(height: 24),
                      _sectionTitle(context, strings.providerExperienceSection),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _experienceController,
                        label: strings.providerExperienceYearsLabel,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) => _validateExperience(value, strings),
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _radiusController,
                        label: strings.providerServiceRadiusLabel,
                        suffixText: strings.kilometresUnit,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                        ],
                        validator: (value) => _validateRadius(value, strings),
                      ),
                      const SizedBox(height: 12),
                      _textField(
                        controller: _descriptionController,
                        label: strings.providerDescriptionLabel,
                        maxLength: 2000,
                        maxLines: 4,
                        textCapitalization: TextCapitalization.sentences,
                      ),
                      const SizedBox(height: 24),
                      _sectionTitle(context, strings.providerLanguagesSection),
                      const SizedBox(height: 4),
                      Text(strings.providerLanguagesHelper),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          FilterChip(
                            label: Text(strings.providerLanguageKannada),
                            selected: _spokenLanguages.contains('kn'),
                            onSelected: (selected) => _toggleLanguage('kn', selected),
                          ),
                          FilterChip(
                            label: Text(strings.providerLanguageEnglish),
                            selected: _spokenLanguages.contains('en'),
                            onSelected: (selected) => _toggleLanguage('en', selected),
                          ),
                          FilterChip(
                            label: Text(strings.providerLanguageTulu),
                            selected: _spokenLanguages.contains('tcy'),
                            onSelected: (selected) => _toggleLanguage('tcy', selected),
                          ),
                        ],
                      ),
                      if (_languageError)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            strings.providerSelectLanguage,
                            style: TextStyle(color: Theme.of(context).colorScheme.error),
                          ),
                        ),
                      const SizedBox(height: 24),
                      _sectionTitle(context, strings.providerHoursSection),
                      const SizedBox(height: 4),
                      Text(strings.providerHoursHelper),
                      const SizedBox(height: 8),
                      WorkingHoursEditor(
                        hours: _workingHours,
                        weekdayNames: weekdayNames,
                        closedLabel: strings.providerClosedDay,
                        opensAtLabel: strings.providerOpensAt,
                        closesAtLabel: strings.providerClosesAt,
                        onChanged: (value) {
                          setState(() {
                            _workingHours = value;
                            _hoursError = null;
                          });
                        },
                      ),
                      if (_hoursError != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            _hoursError!,
                            style: TextStyle(color: Theme.of(context).colorScheme.error),
                          ),
                        ),
                      const SizedBox(height: 12),
                      _sectionTitle(context, strings.providerPhotoSection),
                      const SizedBox(height: 4),
                      Text(strings.providerPhotoOptional),
                      const SizedBox(height: 10),
                      if (_selectedPhoto != null)
                        Center(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.file(
                              File(_selectedPhoto!.path),
                              width: 144,
                              height: 144,
                              fit: BoxFit.cover,
                              semanticLabel: strings.providerSelectedPhoto,
                            ),
                          ),
                        )
                      else
                        const Center(
                          child: CircleAvatar(
                            radius: 48,
                            child: Icon(Icons.person_outline_rounded, size: 48),
                          ),
                        ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _saving ? null : () => _choosePhoto(strings),
                        icon: const Icon(Icons.add_a_photo_outlined),
                        label: Text(
                          _selectedPhoto == null
                              ? strings.providerChoosePhoto
                              : strings.providerChangePhoto,
                        ),
                      ),
                      if (_saveError != null) ...[
                        const SizedBox(height: 16),
                        _InfoBanner(
                          icon: Icons.error_outline_rounded,
                          message: _saveError!,
                          isError: true,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _saving ? null : () => _submit(strings),
                  icon: _saving
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(
                    _saving
                        ? strings.providerSavingProfile
                        : widget.initialProfile?.profileStatus == 'REJECTED'
                            ? strings.providerResubmitProfile
                            : strings.providerSubmitProfile,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _serviceCategoryGroups() {
    final roots = widget.categories.where((category) => category.parentId == null).toList();
    if (roots.isEmpty) return widget.categories.map(_serviceTile).toList();

    final result = <Widget>[];
    for (final root in roots) {
      final children = widget.categories
          .where((category) => category.parentId == root.id)
          .toList();
      if (children.isEmpty) {
        result.add(_serviceTile(root));
      } else {
        result.add(
          ExpansionTile(
            key: PageStorageKey<String>('service-category-${root.id}'),
            title: Text(root.name),
            initiallyExpanded: true,
            children: children.map(_serviceTile).toList(growable: false),
          ),
        );
      }
    }
    return result;
  }

  Widget _serviceTile(ServiceCategory category) {
    final selected = _serviceIds.contains(category.id);
    final limitReached = _serviceIds.length >= 5 && !selected;
    return CheckboxListTile(
      value: selected,
      onChanged: _saving || limitReached
          ? null
          : (value) => _toggleService(category.id, value ?? false),
      title: Text(category.name),
      controlAffinity: ListTileControlAffinity.leading,
      dense: true,
    );
  }

  Widget _textField({
    required TextEditingController controller,
    required String label,
    String? helperText,
    String? suffixText,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    TextInputAction? textInputAction,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        helperText: helperText,
        suffixText: suffixText,
        border: const OutlineInputBorder(),
        alignLabelWithHint: maxLines > 1,
      ),
      validator: validator,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      textInputAction: textInputAction,
      inputFormatters: inputFormatters,
      maxLength: maxLength,
      maxLines: maxLines,
      enabled: !_saving,
    );
  }

  Widget _sectionTitle(BuildContext context, String title) => Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
      );
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({
    required this.icon,
    required this.message,
    this.isError = false,
  });

  final IconData icon;
  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isError ? colors.errorContainer : colors.secondaryContainer;
    final foreground = isError ? colors.onErrorContainer : colors.onSecondaryContainer;
    return Semantics(
      liveRegion: isError,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: foreground),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: TextStyle(color: foreground))),
          ],
        ),
      ),
    );
  }
}
