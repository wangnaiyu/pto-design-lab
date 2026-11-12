---
{
  "entry_id": "agent-in-the-loop",
  "intent": "design",
  "source_kind": "native",
  "sources": [
    "https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/programming_guide/tensor/debug/debug.md",
    "https://modelcontextprotocol.io/specification/2025-06-18/architecture"
  ],
  "data_level": "L2",
  "data_summary": "4张截图仅替换“基线运行”字段从日期戳起的数字，原有截断显示保留；其他文字、设备配置、性能数值与图形逐像素恢复原图。原型数值本来即为构造结果，不是实机采集。研究分类55条、19+14=33、60.0%明确为方法示意。",
  "generation_summary": "保留原稿完整内容、原图与图示，仅作信息脱敏、内部实例构造替换及必要事实口径修正。保留 11 个 section、13 个表、4 SVG 与4张原型截图；截图外置为 assets/prototype-1..4.png，放大交互保留。 用户限定仅修改基线运行数字后缀；无损PNG输出，遮罩外解码像素完全一致。",
  "generation": {
    "tool": "redact_screenshots.py",
    "version": "baseline-suffix-only-v2",
    "command": "redact_screenshots.py (fixed recipe and original report images)"
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

# Agent in the loop：把建议组织成可检查的实验 · 来源与数据说明

## 内容范围

保留 11 个 section、13 个表、4 SVG 与4张原型截图；截图外置为 assets/prototype-1..4.png，放大交互保留。

## 数据与事实边界

4张截图仅替换“基线运行”字段从日期戳起的数字，原有截断显示保留；其他文字、设备配置、性能数值与图形逐像素恢复原图。原型数值本来即为构造结果，不是实机采集。研究分类55条、19+14=33、60.0%明确为方法示意。

构造场景服务于方法、流程与交互说明，不能作为真实运行记录、真实用户分布或产品收益证据。公开技术事实与上游字段名保持原样；前端不渲染内部数据等级或批准标签。

## 参考材料

- https://gitcode.com/cann/pypto/blob/70e66396d0055fc2b5b76c0a282bdbc0a4f1f7bf/docs/zh/guide/programming_guide/tensor/debug/debug.md
- https://modelcontextprotocol.io/specification/2025-06-18/architecture

## 素材与权利

原有图片、图示和代码绘制图按原稿保留。参考截图标 Refer，不改写第三方原图中的公开样例结果。第三方许可待办按用户决定关闭；最终成品签收及发布批准仍未完成，本文件不授予发布许可。
