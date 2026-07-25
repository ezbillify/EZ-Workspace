import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/live_list.dart';

/// Live activity feed — streams the shared `audit_logs` table in realtime.
class ActivityScreen extends StatelessWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Activity',
                        style: TextStyle(
                          fontSize: AppTheme.fluid(context, 24, 30),
                          fontWeight: FontWeight.w900,
                          color: AppColors.ink,
                        )),
                    Text('Live workspace events', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
              ),
              const Icon(Icons.podcasts, color: AppColors.primary),
            ],
          ),
        ),
        const Expanded(
          child: LiveList(table: 'audit_logs', icon: Icons.history, limit: 60),
        ),
      ],
    );
  }
}
