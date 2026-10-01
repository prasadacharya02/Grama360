import 'package:flutter/material.dart';

import 'provider_models.dart';

class WorkingHoursEditor extends StatelessWidget {
  const WorkingHoursEditor({
    required this.hours,
    required this.weekdayNames,
    required this.closedLabel,
    required this.opensAtLabel,
    required this.closesAtLabel,
    required this.onChanged,
    super.key,
  });

  final List<ProviderWorkingHour> hours;
  final List<String> weekdayNames;
  final String closedLabel;
  final String opensAtLabel;
  final String closesAtLabel;
  final ValueChanged<List<ProviderWorkingHour>> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(7, (weekday) {
        final hour = hours.firstWhere(
          (value) => value.weekday == weekday,
          orElse: () => ProviderWorkingHour(
            weekday: weekday,
            isClosed: true,
            opensAt: null,
            closesAt: null,
          ),
        );
        final timeSummary = hour.isClosed
            ? closedLabel
            : '${_formatTime(context, hour.opensAt)} – ${_formatTime(context, hour.closesAt)}';

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: Column(
            children: [
              SwitchListTile.adaptive(
                title: Text(weekdayNames[weekday]),
                subtitle: Text(timeSummary),
                value: !hour.isClosed,
                onChanged: (isOpen) => _setOpen(hour, isOpen),
              ),
              if (!hour.isClosed)
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickTime(context, hour, opensAt: true),
                          icon: const Icon(Icons.schedule_rounded),
                          label: Text(
                            '$opensAtLabel: ${_formatTime(context, hour.opensAt)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickTime(context, hour, opensAt: false),
                          icon: const Icon(Icons.schedule_rounded),
                          label: Text(
                            '$closesAtLabel: ${_formatTime(context, hour.closesAt)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  void _setOpen(ProviderWorkingHour hour, bool isOpen) {
    _replace(
      hour,
      ProviderWorkingHour(
        weekday: hour.weekday,
        isClosed: !isOpen,
        opensAt: isOpen ? (hour.opensAt ?? '09:00') : null,
        closesAt: isOpen ? (hour.closesAt ?? '17:00') : null,
      ),
    );
  }

  Future<void> _pickTime(
    BuildContext context,
    ProviderWorkingHour hour, {
    required bool opensAt,
  }) async {
    final current = opensAt ? hour.opensAt : hour.closesAt;
    final selected = await showTimePicker(
      context: context,
      initialTime: _parseTime(current) ?? TimeOfDay(hour: opensAt ? 9 : 17, minute: 0),
    );
    if (selected == null) return;

    final next = ProviderWorkingHour(
      weekday: hour.weekday,
      isClosed: false,
      opensAt: opensAt ? _to24Hour(selected) : hour.opensAt ?? '09:00',
      closesAt: opensAt ? hour.closesAt ?? '17:00' : _to24Hour(selected),
    );
    _replace(hour, next);
  }

  void _replace(ProviderWorkingHour oldHour, ProviderWorkingHour newHour) {
    final updated = hours
        .map((hour) => hour.weekday == oldHour.weekday ? newHour : hour)
        .toList(growable: false);
    onChanged(updated);
  }

  String _formatTime(BuildContext context, String? value) {
    final time = _parseTime(value);
    return time == null ? '09:00' : MaterialLocalizations.of(context).formatTimeOfDay(time);
  }

  TimeOfDay? _parseTime(String? value) {
    if (value == null || !RegExp(r'^([01][0-9]|2[0-3]):[0-5][0-9]$').hasMatch(value)) {
      return null;
    }
    final parts = value.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  String _to24Hour(TimeOfDay value) =>
      '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
}
