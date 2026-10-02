import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

class AdminReviewPhoto extends StatefulWidget {
  const AdminReviewPhoto({required this.path, super.key});

  final String path;

  @override
  State<AdminReviewPhoto> createState() => _AdminReviewPhotoState();
}

class _AdminReviewPhotoState extends State<AdminReviewPhoto> {
  late Future<String> _downloadUrl;

  @override
  void initState() {
    super.initState();
    _downloadUrl = _loadDownloadUrl();
  }

  @override
  void didUpdateWidget(covariant AdminReviewPhoto oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.path != widget.path) _downloadUrl = _loadDownloadUrl();
  }

  Future<String> _loadDownloadUrl() =>
      FirebaseStorage.instance.ref().child(widget.path).getDownloadURL();

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return FutureBuilder<String>(
      future: _downloadUrl,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Semantics(
            label: strings.providerSelectedPhoto,
            child: const SizedBox.square(
              dimension: 136,
              child: Center(child: Icon(Icons.broken_image_outlined, size: 40)),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const SizedBox.square(
            dimension: 136,
            child: Center(child: CircularProgressIndicator()),
          );
        }
        return Semantics(
          image: true,
          label: strings.providerSelectedPhoto,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Image.network(
              snapshot.data!,
              width: 136,
              height: 136,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.square(
                dimension: 136,
                child: Center(child: Icon(Icons.broken_image_outlined, size: 40)),
              ),
            ),
          ),
        );
      },
    );
  }
}
