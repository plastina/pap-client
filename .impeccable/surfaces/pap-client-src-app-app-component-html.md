---
version: 1
slug: "pap-client-src-app-app-component-html"
primary_target: "pap-client/src/app/app.component.html"
related_targets: []
---

# Plan editor (Operate)

Scope: the single-screen meal-plan editor (pap-client app root and its four components). Mode: Operate.
Audience/job: nutritionist in the consulting room, patient often watching; build a plan inside the appointment on desktop or phone.
Constraint: keep nutrition-facts label for totals, light/dark toggle, language selector.

## Direction contract

THESIS: The plan is the day's menu board. Refuses the white-cards-plus-donut SaaS dashboard.
OWN-WORLD: Warm paper ground (#f3f1ea), dark felt green (#1f2a25) board with grooves and off-white condensed letters, mustard (#e3b23c) reserved for the target meal, menu-row dotted leaders from food name to kcal. Barlow + Barlow Condensed, tabular numerals.
STORY: The nutritionist always sees who the plan is for, which meal receives the next food, and the running totals; adds a food and trims its household measure without hunting.
FIRST VIEWPORT: Slim top bar (PAP, language, theme). Felt board: patient on the left, "Adicionando em" meal chips in the middle (mustard = target), kcal and macros on the right. Search below, tagged with the target. Meals as menu rows; nutrition label rail on the right. Phone: board compact, one meal per swipe (snapped meal is the target), totals pinned to a bottom bar.
FORM: Quadro de cardápio (felt letter board), position 7 of 7; seed:c9a5ccfe7e14f21b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
