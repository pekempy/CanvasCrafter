# Canvas Editor Implementation Plan

## Canvas & Workspace
Focuses on the stage, positioning, and movement physics.
- [x]  Centred Workspace: Canvas should NOT be pinned to the top-left corner of the window, but centred.
- [x]  Background Assets: Set an asset as the background image. This becomes the background of the canvas for this design.
- [x]  Movement Smoothing: Smoother dragging / moving of assets; Remove all snapping to gridlines and smart guides.
- [ ]  Template Editor: Allow users to edit the default canvas templates height / width for future re-use.
- [ ]  Resize UI: This is the popup when you click to set the canvas size, currently too tall to fit on screen. Templates should be scrollable (and editable)
- [x] Be more eager loading fonts, currently they are not applied on refresh until re-selected, horrible UX
- [x] Add "New canvas" button which requires confirmation. This hsould be placed in the top bar and will tell the user it will create a new canvas, discarding any unsaved edits.
- [x] On refresh, default tab on the left should be templates

## Asset & Brand Management
- [x]  Folder Renaming: Allow renaming of asset folders.
- [x]  Sidebar Organization: Folders for templates within the sidebar.
- [x]  Brand Templates: Brands should have a Template tab with templates in that brand.
- [x]  Brand Consolidation: In brands, merge Colours & Typography—have fonts below colours.
- [x]  Stock Integrations: Change Unsplash settings to API settings; include Pexels and Pixabay as well.
- [x]  British English: Use British English spelling throughout (e.g., "Colours").

## UI & Sidebar Navigation
- [x]  Right Sidebar Overlay: Right sidebar should NOT move the canvas over, but instead appear over it.
- [x]  Dynamic Sidebar: Right sidebar should be collapsible, and collapsed unless something is selected.
- [x]  Density: Reduce padding for items in the left and right sidebar.
- [x]  Docking: Floating bar should be dockable to the top of the screen if dragged there.
- [x]  Dropdown Fixes: Dropdown for templates folder/brand is not themed properly—check ALL dropdown themes.
- [x]  Font Selector: Brands -> Fonts dropdown is not searchable and has too many results to see. Also not themed. Use the same element as used in the properties tab. 
- [x] Font selected: Brands -> Dropdown needs a background and be higher z-idnex, currently can still select fonts behind the dropdown.
- [x] Export dropdown: Hidden under properties panel. Set to highest z-index.

### Layers & Grouping
- [x]  Groupable Layers: Layers should be groupable. (Implemented group nesting and multi-select in LayersPanel) A button should group the selected layers together
- [x]  Drag-and-Drop: Layers should be drag-and-drop reorderable.
- [x] Highlighting multiple layers - seems to cap at 2 for highlight but it still selects them? (Updated to use canvas.getActiveObjects() for highlighting)
- [x] Allow locking position (xy) of items, but otherwise can edit. (Updated toggleLock to preserve scaling/rotation)
- [x] Create a PERFECT gitignore that does not upload anything sensitive / auto-generated.
- [x] Still cannot see the grouping button in the layers panel
- [x] Drag items into folders in the layers panel.
- [x] Clearer indication that a layer is selected.

### Element Tools & Styling
- [x]  Gradient Restoration: Gradient option for text and shapes has disappeared. Pride gradient button restored.
- [x]  Fixed Width Text: When wrapping text, it should be fixed width text.
- [x]  Cleanup: Remove hue slider entirely.
- [x]  Edge Border Logic: Stroke Colour, width, etc.