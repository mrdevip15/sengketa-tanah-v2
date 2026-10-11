# Landing page directions

<!-- impeccable:design-schema 1 -->

The landing page presents three independent page compositions. Each uses the supplied firm information, legal service scope, contact destinations, FAQ answers, and article. The visitor chooses a direction through the bottom comparison control; the choice persists locally and is shareable through `?variant=counsel`, `?variant=registry`, or `?variant=brief`.

## Counsel — institutional firm

A white, navy, and brass interface with self-hosted Manrope typography. The opening pairs a compact service proposition on the left with a framed architectural image on the right. The body follows an introduction, a two-column approach grid, a grouped services panel, a vertical process, FAQ, article, and contact invitation. On mobile, the proposition and contact actions precede the architectural image.

## Registry — document-led practice

A committed forest-green interface with pale olive document panels and self-hosted Source Serif display typography. The opening uses a full-width photograph of document review, a large proposition, and an integrated horizontal consultation checklist. The body pairs a land image with service context, uses three service columns and a horizontal four-step process, then presents FAQ, an article spread, and an olive contact strip. Mobile turns the consultation checklist into a vertical sequence and the process into two columns.

## Brief — legal journal

A light blue-gray editorial interface with cobalt fields and self-hosted Source Serif typography. A journal masthead leads into an asymmetric opening with an offset portrait image. An oversized cobalt statement introduces the practice, followed by horizontal service rows, a two-column process, FAQ, an article spread, and a large closing proposition. Mobile preserves the reading order and brings the offset image below the opening action.

## Behavior and constraints

Navigation targets, brand-home link, and URL update when the visitor selects a composition. Each composition exposes one heading at level one, its own service/process targets, and three FAQ items. FAQ items open independently within each composition and allow one open item per group. The shared mobile menu, privacy/disclaimer dialogs, article destination, contact destinations, and conversion tracking remain functional.

Fonts are self-hosted under `assets/fonts/`, with their OFL licenses. Hero images are optimized WebP derivatives of supplied photographs under `assets/images/`. The original article stylesheet remains in `styles.css`; the landing page directions are scoped in `landing-variations.css`.

Do not invent clients, outcomes, ratings, years of experience, or testimonials. Maintain keyboard focus, contrast, reduced-motion behavior, and responsive reading order.
