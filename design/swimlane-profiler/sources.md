---
{
  "entry_id": "swimlane-profiler",
  "intent": "design",
  "source_kind": "derived",
  "sources": [
    "pypto-pmu-semantics",
    "pto-mix-topology-reference",
    "pto-mix-sync-reference",
    "swimlane-l2-generator"
  ],
  "data_level": "L2",
  "data_summary": "已核对生成规则：每场景 2075 tasks / 1344 edges，时序来自确定性生成；公开模型/API 名称保留。原始内部 trace 的路径不外带。现有构造值不是实测，不能包装成已验证收益。",
  "generation_summary": "保留原稿完整内容、原图与图示，仅作信息脱敏、内部实例构造替换及必要事实口径修正。三个原本即为构造的完整诊断场景保留；public 生成器只转换私有来源 metadata，不删除 task、PMU、同步关系或业务代码说明。",
  "generation": {
    "tool": "swimlane-generator",
    "version": "batch-e-2026-11-06",
    "command": "python3 gen_data.py --audience public --output <isolated-output>/swimlane-data.js"
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

# Swimlane Profiler · 来源与数据说明

## 内容范围

三个原本即为构造的完整诊断场景保留；public 生成器只转换私有来源 metadata，不删除 task、PMU、同步关系或业务代码说明。

## 数据与事实边界

已核对生成规则：每场景 2075 tasks / 1344 edges，时序来自确定性生成；公开模型/API 名称保留。原始内部 trace 的路径不外带。现有构造值不是实测，不能包装成已验证收益。

构造场景服务于方法、流程与交互说明，不能作为真实运行记录、真实用户分布或产品收益证据。公开技术事实与上游字段名保持原样；前端不渲染内部数据等级或批准标签。

## 参考材料

- pypto-pmu-semantics
- pto-mix-topology-reference
- pto-mix-sync-reference
- swimlane-l2-generator

## 素材与权利

原有图片、图示和代码绘制图按原稿保留。参考截图标 Refer，不改写第三方原图中的公开样例结果。第三方许可待办按用户决定关闭；最终成品签收及发布批准仍未完成，本文件不授予发布许可。

## PMU 来源 alias 与路径版本（2026-11-09）

页面推荐规则保留安全来源名 `pypto-pmu-semantics`。它由 public 生成器对已登记来源字段精确转换，canonical 页面仍读取 `recommendation.source`；无须改动页面模板或业务数据值。

alias 对应 PyPTO 固定源码快照 `ae0b8730fa1b32283392dca07d3a53cf91df3b9d` 中的 `docs/zh/guide/appendix/env_vars/PYPTO_PROF_PMU_EVENT_TYPE.md` 与 `framework/src/machine/runtime/runner/pmu_common.cpp`。旧私有来源串使用 `docs/zh/tutorials/appendix/env_vars/`，已确认路径漂移；保留旧值用于追溯，不把旧路径当作当前入口。本次核验只确认该本地快照的文件定位，不扩展为所有版本推荐规则已验证。第三方许可待办按用户决定关闭；成品签收与发布批准仍未完成。
