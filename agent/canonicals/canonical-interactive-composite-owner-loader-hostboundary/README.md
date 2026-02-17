# Canonical: InteractiveCompositeOwner (loader-based)

This canonical uses your framework-style asset loader pattern:

- loadComponentAssets(this, "<tag>")
- loadComponentIfNotExists("<child-tag>")

It includes two components:

1) ui-interactive-composite-owner
   - parent-owned shells (handle drag)
   - cross-child item drag orchestration
   - listens to child intent events at stable boundary

2) ui-ico-child
   - exposes getDropZone()
   - emits intent events (delete)
   - allows internal draggable item shells

Files are organized as:
/ui-interactive-composite-owner/*.html|css|js
/ui-ico-child/*.html|css|js
