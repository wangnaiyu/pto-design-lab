---
{
  "entry_id": "fusion-performance-diagnosis",
  "intent": "design",
  "source_kind": "native",
  "sources": [
    "https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/programming_guide/tensor/debug/debug.md",
    "https://github.com/hw-native-sys/pypto/blob/6d0ac8b5a1c1407a5b8b425c6b4ec4ffa1aadb52/runtime/simpler_setup/tools/deps_viewer.py"
  ],
  "data_level": "L2",
  "data_summary": "实例统一 attention_fusion_case / run#12 / DEV0-C05-T029；理论 128.0、场景时长 156.0、差额 28.0 µs，预计 112.0 µs。差额不等同可优化收益。",
  "generation_summary": "保留原稿完整内容、原图与图示，仅作信息脱敏、内部实例构造替换及必要事实口径修正。保留 14 个 section、10 个表、FR-01 至后续分期、理论基线、全链路场景与降级要求。",
  "generation": {
    "tool": "not-applicable",
    "reason": "人工内容整理或前端打包，完整构建记录另行绑定"
  },
  "license": {
    "own": "仅展示、不授予通用再利用许可；用户确认 AI 辅助创作且无共同作者，第三方原有权利除外。",
    "third_party": "2026-11-09 用户决定取消第三方许可 pending，关闭本批该项待办；保留来源/署名及原有条款，未新增授权证明，不声称独立核验已通过。"
  },
  "redistribution": {
    "decision": "approved",
    "basis": "2026-11-12 wangnaiyu explicit final-version publication approval in current Codex chat; review package dated 2026-11-10; D01–D06 closed-by-owner-direction; reviewed Chrome scope and declared unverified limits accepted. Display only; no general reuse license. Facts reviewed within documented scope; hardware hypotheses remain labeled/unverified."
  },
  "review": {
    "decision": "approved",
    "reviewer": "wangnaiyu",
    "reviewed_at": "2026-11-12",
    "payload_digest": "002737a23a5d1325d43d91517359f13ff6b7cd7d2b25393e3109a106ccdc4d3e"
  }
}
---

# 融合算子性能诊断：从异常任务走向可验证的修改 · 来源与数据说明

## 内容范围

保留 14 个 section、10 个表、FR-01 至后续分期、理论基线、全链路场景与降级要求。

## 数据与事实边界

实例统一 attention_fusion_case / run#12 / DEV0-C05-T029；理论 128.0、场景时长 156.0、差额 28.0 µs，预计 112.0 µs。差额不等同可优化收益。

构造场景服务于方法、流程与交互说明，不能作为真实运行记录、真实用户分布或产品收益证据。公开技术事实与上游字段名保持原样；前端不渲染内部数据等级或批准标签。

## 参考材料

- https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/programming_guide/tensor/debug/debug.md
- https://github.com/hw-native-sys/pypto/blob/6d0ac8b5a1c1407a5b8b425c6b4ec4ffa1aadb52/runtime/simpler_setup/tools/deps_viewer.py

## 素材与权利

原有图片、图示和代码绘制图按原稿保留。参考截图标 Refer，不改写第三方原图中的公开样例结果。第三方许可待办按用户决定关闭；最终成品签收及发布批准仍未完成，本文件不授予发布许可。
