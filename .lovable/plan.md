# Smooth Android card selector dragging

## Change
- Detect Android inside the shared card selector without changing iPhone behavior.
- Disable Android's native horizontal gesture takeover while the selector is being dragged, preventing sudden pointer cancellation.
- Keep the existing card selection, haptics, arrows, and hold-to-scrub behavior unchanged.

## Verification
- Confirm the project compiles.
- Exercise a continuous drag in an Android-emulated browser context and verify selection updates through the full gesture without cancellation.
