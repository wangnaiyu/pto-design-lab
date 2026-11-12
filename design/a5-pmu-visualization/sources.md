---
{
  "entry_id": "a5-pmu-visualization",
  "intent": "design",
  "source_kind": "native",
  "sources": [
    "https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/appendix/env_vars/PYPTO_PROF_PMU_EVENT_TYPE.md",
    "https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/framework/src/machine/runtime/runner/pmu_common.cpp"
  ],
  "data_level": "L2",
  "data_summary": "修正 total_cycle 与 wall-clock 等同、聚合计数接近=充分解释等表述。组号/API 字段不脱敏；示意 schema 数值仍为非实测。",
  "generation_summary": "保留原稿完整内容、原图与图示，仅作信息脱敏、内部实例构造替换及必要事实口径修正。保留 13 个 section、12 个表、所有 Group 工作台/交互/状态/验收。",
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

# A5 PMU 数据可视化：把计数器转成可检查的诊断线索 · 来源与数据说明

## 内容范围

保留 13 个 section、12 个表、所有 Group 工作台/交互/状态/验收。

## 数据与事实边界

修正 total_cycle 与 wall-clock 等同、聚合计数接近=充分解释等表述。组号/API 字段不脱敏；示意 schema 数值仍为非实测。

构造场景服务于方法、流程与交互说明，不能作为真实运行记录、真实用户分布或产品收益证据。公开技术事实与上游字段名保持原样；前端不渲染内部数据等级或批准标签。

## 参考材料

- https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/appendix/env_vars/PYPTO_PROF_PMU_EVENT_TYPE.md
- https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/framework/src/machine/runtime/runner/pmu_common.cpp

## 素材与权利

原有图片、图示和代码绘制图按原稿保留。参考截图标 Refer，不改写第三方原图中的公开样例结果。第三方许可待办按用户决定关闭；最终成品签收及发布批准仍未完成，本文件不授予发布许可。
