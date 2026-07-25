import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../widgets/ai_orb.dart';

class _Msg {
  _Msg(this.text, this.fromAi);
  final String text;
  final bool fromAi;
}

class EzAiScreen extends StatefulWidget {
  const EzAiScreen({super.key});
  @override
  State<EzAiScreen> createState() => _EzAiScreenState();
}

class _EzAiScreenState extends State<EzAiScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<_Msg> _messages = [
    _Msg('Hi 👋 I\'m EZ AI. Ask me about your workspace — attendance, payroll, tasks, or anything else.', true),
  ];
  bool _thinking = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send() {
    final t = _input.text.trim();
    if (t.isEmpty) return;
    setState(() {
      _messages.add(_Msg(t, false));
      _input.clear();
      _thinking = true;
    });
    _scrollDown();
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      setState(() {
        _thinking = false;
        _messages.add(_Msg(
            'EZ AI is being connected to your workspace backend. Once linked, I\'ll answer this live from your EZ-Workspace data. ✨',
            true));
      });
      _scrollDown();
    });
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(6, 8, 20, 4),
          child: Row(children: [
            if (Navigator.of(context).canPop())
              IconButton(
                icon: const Icon(Icons.arrow_back),
                color: AppColors.ink,
                onPressed: () => Navigator.of(context).maybePop(),
              ),
            const AiOrb(size: 44),
            const SizedBox(width: 4),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text('EZ AI',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.ink)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                      const SizedBox(width: 5),
                      Text('LIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.primary)),
                    ]),
                  ),
                ]),
                Text('Your workspace assistant', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ]),
        ),
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            itemCount: _messages.length + (_thinking ? 1 : 0),
            itemBuilder: (context, i) {
              if (i == _messages.length) return _bubble(_Msg('…', true), typing: true);
              return _bubble(_messages[i]);
            },
          ),
        ),
        _composer(),
      ],
    );
  }

  Widget _bubble(_Msg m, {bool typing = false}) {
    return Align(
      alignment: m.fromAi ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: m.fromAi ? NeuDecoration.cardFill : AppColors.primary,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(m.fromAi ? 4 : 16),
            bottomRight: Radius.circular(m.fromAi ? 16 : 4),
          ),
          boxShadow: m.fromAi ? NeuDecoration.soft(distance: 4, blur: 8, alpha: 0.35) : null,
        ),
        child: typing
            ? Text('EZ AI is typing…', style: TextStyle(fontSize: 13, color: AppColors.muted, fontStyle: FontStyle.italic))
            : Text(m.text,
                style: TextStyle(
                  fontSize: 13.5, height: 1.35,
                  color: m.fromAi ? AppColors.ink : Colors.white,
                  fontWeight: FontWeight.w500,
                )),
      ),
    );
  }

  Widget _composer() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
      child: GlassCard(
        padding: const EdgeInsets.fromLTRB(8, 4, 8, 4),
        radius: AppRadius.pill,
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _input,
              onSubmitted: (_) => _send(),
              decoration: InputDecoration(
                hintText: 'Ask EZ AI…',
                hintStyle: TextStyle(color: AppColors.muted),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ),
          GestureDetector(
            onTap: _send,
            child: Container(
              width: 42, height: 42,
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(Icons.arrow_upward, color: Colors.white, size: 20),
            ),
          ),
        ]),
      ),
    );
  }
}
