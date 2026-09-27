# Architecture Decisions

- Homepage sections use native fragment links inside the shared marketing shell so navigation remains accessible and smoothly scrolls without client state.
- Legal copy (privacy, terms) lives only in `src/data/legal.ts`; the website and in-app legal screens both render from it so the two can never drift.
