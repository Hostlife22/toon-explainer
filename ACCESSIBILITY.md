# Accessibility

toon-explainer aims to make its documentation, preview controls and video output usable by people with different visual, hearing, motor and cognitive needs. [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/) is the reference for improvements to web content and controls. This is a development goal; the preview and the example films have not undergone a complete conformance audit.

## Current support and limitations

- Documentation uses headings, descriptive links and text descriptions. Showcase images have alternative text, but it does not replace a full description of each animation.
- The preview starts paused and offers a play button, a timeline slider and keyboard stepping (space, arrow keys). It still needs clearer accessible names, playback-state announcements and a full assistive-technology review.
- Characters, lettering and graphics are drawn into Canvas pixels and are not exposed as structured content to screen readers. Narration, transcripts and data must be supplied separately.
- `script2spec.py` writes an SRT file with the voiceover text for every shot. It is a starting point for captions, not a reviewed caption track.
- README GIFs loop without an in-page pause control. Some shots use camera shake, punch zooms, flashes, fire flicker or rain.
- Contact sheets and still exports provide ways to inspect a film without playing it.

## Viewing without animation

Render a contact sheet with one still per shot, or stills at chosen times:

```sh
uv run --with playwright python scripts/render.py examples/showcase/spec.json --sheet renders/sheet.jpg
uv run --with playwright python scripts/render.py examples/showcase/spec.json --stills 2,6 --out renders/stills
```

For narrated films, publish a transcript and burn or attach captions. The animation alone cannot communicate the narration to every viewer.

## Contribution guidance

- Provide descriptive alternative text for informative images and a text equivalent for essential on-screen actions or data.
- Make preview controls usable with a keyboard, with accessible names and visible focus. Expose playback state in text.
- Respect `prefers-reduced-motion` in web previews and offer stills when movement is not essential.
- Avoid flashing effects. Review `flash`, `zoom-punch`, `lightning` and fast fire against the [WCAG flash criteria](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold).
- Use readable type and sufficient contrast for information-bearing text: at least 4.5:1 for normal text and 3:1 for large text, as defined by [WCAG contrast guidance](https://www.w3.org/TR/WCAG22/#contrast-minimum). Check labels over every changing background, including shots with a `grade`.
- Communicate map regions and chart values through labels as well as color.
- Provide synchronized captions for spoken audio and meaningful sounds, and keep captions and essential graphics clear of each other.

## Report an accessibility issue

Open an [issue](https://github.com/Hostlife22/toon-explainer/issues) with **Accessibility:** in the title. Include the page, example or file; the barrier you encountered; expected behavior; and your browser, operating system and assistive technology when relevant. A timestamp helps identify a problem within a film.

Include only information you are comfortable sharing publicly. Improvements can be submitted through the [contribution process](CONTRIBUTING.md).
