---
{
  "entry_id": "runtime-execution-graph-explorer",
  "intent": "design",
  "source_kind": "derived",
  "sources": [
    "constructed-pipeline-v1",
    "https://github.com/hw-native-sys/pypto"
  ],
  "data_level": "L2",
  "data_summary": "新数据384 tasks / 816边 / 384 tensors / 512时序实例；24阶段×16任务、独立公式时序；8 AIC+16 AIV是场景泳道，未指称具体芯片。未读原拓扑、shape或实测时序作为生成输入。",
  "generation_summary": "独立构造输入→现有 schema builder；未使用真实拓扑/形状/时序。24阶段×16任务，每阶段消费前阶段两个输出；每四阶段添加显式跨阶段边。",
  "generation": {
    "tool": "runtime-scenario-and-builder",
    "version": "content-restoration-v2",
    "command": "make_runtime_input.py --output INPUT; build-demo-data.py --source INPUT --name-map name_map_public.json --source-kind constructed --audience public --output OUTPUT"
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

# 执行逻辑图探索 · 来源与数据说明

## 内容范围

保留图、详情、时序、Tensor和核心探索交互；另准备完全独立构造输入及生成物。

## 数据与事实边界

新数据384 tasks / 816边 / 384 tensors / 512时序实例；24阶段×16任务、独立公式时序；8 AIC+16 AIV是场景泳道，未指称具体芯片。未读原拓扑、shape或实测时序作为生成输入。

构造场景服务于方法、流程与交互说明，不能作为真实运行记录、真实用户分布或产品收益证据。公开技术事实与上游字段名保持原样；前端不渲染内部数据等级或批准标签。

## 参考材料

- constructed-pipeline-v1
- https://github.com/hw-native-sys/pypto

## 素材与权利

原有图片、图示和代码绘制图按原稿保留。参考截图标 Refer，不改写第三方原图中的公开样例结果。第三方许可待办按用户决定关闭；最终成品签收及发布批准仍未完成，本文件不授予发布许可。
