/* Wanderer’s Atlas — Final Mark */
(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const BUILD_LABEL = "Wanderer’s Atlas";
  const MAP_IMAGE = "skyrim-map.jpg";
  const MAP_WIDTH = 8192;
  const MAP_HEIGHT = 6144;

  // Keep these keys stable so existing user entries do not reset.
  const STORAGE_KEY = "wanderers-atlas-mark-3-smooth-zoom-stable-pane-v1";
  const SETTINGS_KEY = "wanderers-atlas-mark-3-smooth-zoom-stable-pane-settings-v1";

  const categories = [
    { id: "city", label: "City", color: "#2f5878" },
    { id: "town", label: "Town", color: "#3f6f78" },
    { id: "cache", label: "Cache", color: "#9a6424" },
    { id: "contact", label: "Contact", color: "#466f75" },
    { id: "threat", label: "Threat", color: "#8e332b" },
    { id: "camp", label: "Camp", color: "#5f7038" },
    { id: "hunting", label: "Hunting Spot", color: "#6f5f2d" },
    { id: "ore", label: "Ore Vein", color: "#6d6f73" },
    { id: "ingredient", label: "Ingredient", color: "#4f7a45" },
    { id: "range", label: "Range", color: "#2f6548" },
    { id: "route", label: "Trail", color: "#68472e" },
    { id: "post", label: "Guild Post", color: "#6d5a32" },
    { id: "trailmark", label: "Trailmark", color: "#4f6535" },
    { id: "station", label: "Station", color: "#5b6f4a" },
    { id: "landmark", label: "Landmark", color: "#5d5950" }
  ];

  const categoryById = Object.fromEntries(categories.map(c => [c.id, c]));

  const SIGIL_FIT = {
    city: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.22, scaleY: 1.10, offsetX: 0.18, offsetY: -1.15 },
    town: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: 0.05, offsetY: -1.66 },
    cache: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: -0.19, offsetY: -0.08 },
    contact: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: 0.02, offsetY: 1.97 },
    threat: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.22, scaleY: 1.10, offsetX: 0.05, offsetY: 0.33 },
    camp: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.12, scaleY: 1.08, offsetX: 0.02, offsetY: -0.44 },
    hunting: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: -0.01, offsetY: 1.15 },
    ore: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: 0.45, offsetY: -0.19 },
    ingredient: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.18, scaleY: 1.08, offsetX: 1.13, offsetY: -0.16 },
    range: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: 0.08, offsetY: 0.29 },
    route: { domMaxWidth: 28, domMaxHeight: 28, maxSize: 35, scaleX: 1.86, scaleY: 1.52, offsetX: -3.0, offsetY: -4.0 },
    post: { domMaxWidth: 27, domMaxHeight: 27, maxSize: 35, scaleX: 1.62, scaleY: 1.42, offsetX: 0.75, offsetY: -3.5 },
    trailmark: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.22, scaleY: 1.10, offsetX: 0.52, offsetY: 0.23 },
    station: { domMaxWidth: 24, domMaxHeight: 24, maxSize: 33, scaleX: 1, scaleY: 1, offsetX: -0.04, offsetY: -1.59 },
    landmark: { domMaxWidth: 25, domMaxHeight: 25, maxSize: 34, scaleX: 1.15, scaleY: 1.12, offsetX: 0.17, offsetY: -1.02 }
  };

  function getSigilFit(categoryId) {
    return SIGIL_FIT[categoryId] || { domMaxWidth: 22, domMaxHeight: 22, maxSize: 30, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
  }

  function getSigilStyle(categoryId) {
    const fit = getSigilFit(categoryId);
    const transformParts = [];
    if (fit.offsetX || fit.offsetY) transformParts.push(`translate(${fit.offsetX}px, ${fit.offsetY}px)`);
    if (fit.scaleX !== 1 || fit.scaleY !== 1) transformParts.push(`scale(${fit.scaleX}, ${fit.scaleY})`);
    const transform = transformParts.length ? ` transform: ${transformParts.join(' ')}; transform-origin: center;` : '';
    return `max-width: ${fit.domMaxWidth}px; max-height: ${fit.domMaxHeight}px;${transform}`;
  }


  const CATEGORY_SIGIL_FILES = {
    city: "sigils/01.png",
    town: "sigils/02.png",
    cache: "sigils/03.png",
    contact: "sigils/04.png",
    threat: "sigils/05.png",
    camp: "sigils/06.png",
    hunting: "sigils/07.png",
    ore: "sigils/08.png",
    ingredient: "sigils/09.png",
    range: "sigils/10.png",
    route: "sigils/11.png",
    post: "sigils/12.png",
    trailmark: "sigils/13.png",
    station: "sigils/14.png",
    landmark: "sigils/15.png"
  };

  const sigilImageCache = {};

  // Public Share/Receive safety limits.
  const SECURITY_LIMITS = {
    maxShareCodeChars: 1000000,
    maxImportEntries: 500,
    maxPointsPerFeature: 2000,
    maxTitleChars: 120,
    maxCreatorChars: 80,
    maxNotesChars: 5000,
    maxIdChars: 120,
    duplicateDistancePixels: 35
  };

  // Optional online short-code sharing.
  const SHORT_CODE_LENGTH = 7;
  const SHORT_CODE_PATTERN = /^[A-Z0-9]{7}$/;
  const SHORT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const atlasExternalConfig = window.WANDERERS_ATLAS_CONFIG || {};
  const SUPABASE_CONFIG = {
    enabled: false,
    url: "",
    anonKey: "",
    table: "atlas_shares",
    expiresDays: 30,
    ...(atlasExternalConfig.supabase || {})
  };

  // ---------------------------------------------------------------------------
  // Runtime state
  // ---------------------------------------------------------------------------

  const state = {
    features: [],
    filters: Object.fromEntries(categories.map(c => [c.id, true])),
    mode: "select",
    selectedId: null,
    creatorName: "",
    creatorFilter: "",
    search: "",
    draftFeature: null,
    drawPoints: [],
    undoStack: [],
    panelCollapsed: false,
    toolPanelCollapsed: false,
    pendingReceive: null,
    pendingReceiveMeta: null
  };

  // ---------------------------------------------------------------------------
  // Map setup
  // ---------------------------------------------------------------------------

  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 3,
    zoomControl: false,
    zoomSnap: 0,
    zoomDelta: 0.5,
    wheelDebounceTime: 0,
    wheelPxPerZoomLevel: 9999,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: false,
    touchZoom: true,
    inertia: true,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    doubleClickZoom: false
  });

  const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
  const baseMapLayer = L.imageOverlay(MAP_IMAGE, bounds, {
    interactive: false,
    className: "base-map-image"
  }).addTo(map);

  map.fitBounds(bounds);
  map.setMaxBounds([[-240, -240], [MAP_HEIGHT + 240, MAP_WIDTH + 240]]);

  const mapElement = document.getElementById("map");
  const domLayer = document.createElement("div");
  domLayer.className = "dom-feature-layer leaflet-pane-feature-layer";
  map.getPane("overlayPane").appendChild(domLayer);

  let overlayFrame = 0;
  let overlayTimeout = 0;
  let isMapZooming = false;
  let isCustomSmoothZooming = false;
  let smoothZoomFrame = 0;
  let smoothZoomTarget = null;
  let smoothZoomAnchor = null;
  let smoothZoomIdleTimer = 0;
  let lastDragEndedAt = 0;
  let isTrailDragging = false;
  let pendingDrawingDragPoint = null;
  let draftDrawingSource = "click";

  const el = {
    toolButtons: [...document.querySelectorAll(".tool-button")],
    creatorInput: document.getElementById("creatorInput"),
    undoBtn: document.getElementById("undoBtn"),
    statusBar: document.getElementById("statusBar"),
    ledgerPanel: document.getElementById("ledgerPanel"),
    ledgerToggle: document.getElementById("ledgerToggle"),
    toolPanel: document.getElementById("toolPanel"),
    toolToggle: document.getElementById("toolToggle"),
    emptySelection: document.getElementById("emptySelection"),
    editorForm: document.getElementById("editorForm"),
    featureId: document.getElementById("featureId"),
    titleInput: document.getElementById("titleInput"),
    categoryInput: document.getElementById("categoryInput"),
    confidenceInput: document.getElementById("confidenceInput"),
    creatorMeta: document.getElementById("creatorMeta"),
    notesInput: document.getElementById("notesInput"),
    deleteFeatureBtn: document.getElementById("deleteFeatureBtn"),
    searchInput: document.getElementById("searchInput"),
    creatorFilterInput: document.getElementById("creatorFilterInput"),
    categoryFilters: document.getElementById("categoryFilters"),
    featureList: document.getElementById("featureList"),
    helpBtn: document.getElementById("helpBtn"),
    shareBtn: document.getElementById("shareBtn"),
    receiveBtn: document.getElementById("receiveBtn"),
    saveImageBtn: document.getElementById("saveImageBtn"),
    cleanBtn: document.getElementById("cleanBtn"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    helpDialog: document.getElementById("helpDialog"),
    shareDialog: document.getElementById("shareDialog"),
    receiveDialog: document.getElementById("receiveDialog"),
    shareFeatureList: document.getElementById("shareFeatureList"),
    shareSelectionSummary: document.getElementById("shareSelectionSummary"),
    shareSelectAllBtn: document.getElementById("shareSelectAllBtn"),
    shareSelectNoneBtn: document.getElementById("shareSelectNoneBtn"),
    copyShortShareBtn: document.getElementById("copyShortShareBtn"),
    shortShareStatus: document.getElementById("shortShareStatus"),
    receiveCodeInput: document.getElementById("receiveCodeInput"),
    reviewReceiveBtn: document.getElementById("reviewReceiveBtn"),
    receivePreview: document.getElementById("receivePreview"),
    receiveMergeBtn: document.getElementById("receiveMergeBtn"),
    receiveReplaceBtn: document.getElementById("receiveReplaceBtn")
  };

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.label;
    el.categoryInput.appendChild(option);
  });

  init();

  function init() {
    preloadSigilImages();
    loadState();
    renderFilters();
    renderAll();
    bindEvents();
    updateModeButtons();
    updateUndoButton();
    updatePanelState();
    setupBuildBadge();
    setStatus("Wanderer’s Atlas");
  }

  function bindEvents() {
    el.toolButtons.forEach(button => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    el.creatorInput.addEventListener("input", () => {
      state.creatorName = normalizeName(el.creatorInput.value);
      saveState();
    });

    el.undoBtn.addEventListener("click", undoLastAction);

    el.ledgerToggle.addEventListener("click", () => {
      state.panelCollapsed = !state.panelCollapsed;
      updatePanelState();
      saveSettings();
      setTimeout(() => {
        map.invalidateSize();
        scheduleOverlayRender();
      }, 220);
    });

    el.toolToggle.addEventListener("click", () => {
      state.toolPanelCollapsed = !state.toolPanelCollapsed;
      updatePanelState();
      saveSettings();
      setTimeout(() => {
        map.invalidateSize();
        scheduleOverlayRender();
      }, 220);
    });

    el.editorForm.addEventListener("submit", event => {
      event.preventDefault();
      saveSelectedFeature();
    });

    el.deleteFeatureBtn.addEventListener("click", deleteSelectedFeature);

    el.searchInput.addEventListener("input", () => {
      state.search = el.searchInput.value.trim().toLowerCase();
      renderAll();
    });

    el.creatorFilterInput.addEventListener("change", () => {
      state.creatorFilter = el.creatorFilterInput.value;
      renderAll();
    });

    el.zoomInBtn?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      smoothZoomBy(0.5, centerContainerPoint());
    });

    el.zoomOutBtn?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      smoothZoomBy(-0.5, centerContainerPoint());
    });

    map.on("click", handleMapClick);
    map.on("dragend", () => { lastDragEndedAt = Date.now(); });

    mapElement.addEventListener("mousedown", startTrailDrag, { passive: false });
    mapElement.addEventListener("wheel", handleSmoothWheel, { passive: false });
    document.addEventListener("mousemove", continueTrailDrag, { passive: false });
    document.addEventListener("mouseup", stopTrailDrag, { passive: false });
    window.addEventListener("blur", stopTrailDrag);

    map.on("zoomstart", () => {
      isMapZooming = true;
      domLayer.classList.add("is-map-zooming");
    });

    map.on("zoom", () => {
      // Custom smooth zoom redraws entries during each animation frame.
      // Leaflet handles pan movement through overlayPane.
    });

    map.on("zoomend", () => {
      if (isCustomSmoothZooming) return;

      isMapZooming = false;
      scheduleOverlayRender();
      requestAnimationFrame(() => domLayer.classList.remove("is-map-zooming"));
    });

    map.on("moveend resize viewreset", () => {
      renderDomOverlay();
      requestAnimationFrame(renderDomOverlay);
      setTimeout(renderDomOverlay, 50);
    });

    baseMapLayer.on("load", () => {
      map.invalidateSize(false);
      scheduleOverlayRender();
    });

    el.helpBtn.addEventListener("click", () => el.helpDialog.showModal());
    el.shareBtn.addEventListener("click", openShareDialog);
    el.receiveBtn.addEventListener("click", openReceiveDialog);
    el.saveImageBtn.addEventListener("click", exportFullMapImage);
    el.cleanBtn.addEventListener("click", cleanAtlas);

    el.shareSelectAllBtn.addEventListener("click", () => setShareSelection(true));
    el.shareSelectNoneBtn.addEventListener("click", () => setShareSelection(false));
    el.copyShortShareBtn.addEventListener("click", copyShortShareCode);
    el.reviewReceiveBtn.addEventListener("click", reviewReceiveCode);
    el.receiveMergeBtn.addEventListener("click", () => applyReceivedFeatures("merge"));
    el.receiveReplaceBtn.addEventListener("click", () => applyReceivedFeatures("replace"));

    document.querySelectorAll("[data-close]").forEach(button => {
      button.addEventListener("click", () => document.getElementById(button.dataset.close)?.close());
    });

    document.querySelectorAll("dialog").forEach(dialog => {
      dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
      });
    });

    window.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        if (state.drawPoints.length || state.draftFeature) {
          cancelDrawing();
        } else {
          selectFeature(null);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        const editable = event.target.closest?.("input, textarea, select");
        if (!editable) {
          event.preventDefault();
          undoLastAction();
        }
      }

    });
  }

  function setMode(mode) {
    if (state.mode !== mode) cancelDrawing(false);

    state.mode = mode;

    if (mode === "route" || mode === "range") {
      map.dragging.disable();
      map.getContainer().classList.add("is-drawing");
    } else {
      map.dragging.enable();
      map.getContainer().classList.remove("is-drawing");
    }

    updateModeButtons();

    const labels = {
      select: "Select features or drag the map",
      marker: "Click the map to place a mark",
      route: "Drag to sketch a trail, or click points",
      range: "Drag to sketch a range boundary, or click points"
    };
    setStatus(labels[mode] || "Ready");
  }

  function updateModeButtons() {
    el.toolButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === state.mode);
    });
  }

  function baseImageRect() {
    const image = baseMapLayer.getElement?.();
    if (!image) return null;

    const imageRect = image.getBoundingClientRect();
    const mapRect = mapElement.getBoundingClientRect();

    if (!imageRect.width || !imageRect.height) return null;

    return {
      left: imageRect.left - mapRect.left,
      top: imageRect.top - mapRect.top,
      width: imageRect.width,
      height: imageRect.height
    };
  }

  function eventToImagePoint(event) {
    const rect = baseImageRect();
    if (!rect) return null;

    const mapRect = mapElement.getBoundingClientRect();
    const mouse = event.originalEvent || event;
    const localX = mouse.clientX - mapRect.left;
    const localY = mouse.clientY - mapRect.top;

    const xRatio = (localX - rect.left) / rect.width;
    const yRatio = (localY - rect.top) / rect.height;

    if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) return null;

    return {
      x: Math.round(xRatio * MAP_WIDTH),
      y: Math.round(yRatio * MAP_HEIGHT)
    };
  }

  function imagePointToContainerPoint(point) {
    const rect = baseImageRect();
    if (!rect) return null;

    return L.point(
      rect.left + (point.x / MAP_WIDTH) * rect.width,
      rect.top + (point.y / MAP_HEIGHT) * rect.height
    );
  }

  function imagePointToScreen(point) {
    if (!imagePointIsInside(point)) return null;

    const containerPoint = imagePointToContainerPoint(point);
    if (!containerPoint) return null;

    const layerPoint = map.containerPointToLayerPoint(containerPoint);

    return {
      x: layerPoint.x,
      y: layerPoint.y
    };
  }

  function imagePointToLatLng(point) {
    const containerPoint = imagePointToContainerPoint(point);
    if (!containerPoint) return L.latLng(point.y, point.x);

    return map.containerPointToLatLng(containerPoint);
  }

  function imagePointIsInside(point) {
    return point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= 0 &&
      point.x <= MAP_WIDTH &&
      point.y >= 0 &&
      point.y <= MAP_HEIGHT;
  }

  function shouldIgnoreDrawingTarget(target) {
    return !!target?.closest?.(".dom-entry, .dom-draft-actions, .custom-zoom, .tool-panel, .ledger-panel, .atlas-header");
  }

  function screenDistanceBetweenImagePoints(a, b) {
    const first = imagePointToScreen(a);
    const second = imagePointToScreen(b);

    if (!first || !second) return Infinity;

    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function addDragDrawPoint(point, minScreenDistance = 7) {
    if (!imagePointIsInside(point)) return false;

    const previous = state.drawPoints[state.drawPoints.length - 1];

    if (previous && screenDistanceBetweenImagePoints(previous, point) < minScreenDistance) {
      return false;
    }

    state.drawPoints.push(point);
    return true;
  }

  function isDrawingMode() {
    return state.mode === "route" || state.mode === "range";
  }

  function drawingLabel() {
    return state.mode === "range" ? "range" : "trail";
  }

  function startTrailDrag(event) {
    if (!isDrawingMode()) return;
    if (event.button !== 0) return;
    if (shouldIgnoreDrawingTarget(event.target)) return;

    const point = eventToImagePoint(event);

    if (!imagePointIsInside(point)) {
      setStatus(`Start the ${drawingLabel()} inside the map image.`);
      return;
    }

    // Trail and Range both keep normal single-click point placement.
    // A drag only begins after the mouse actually moves.
    pendingDrawingDragPoint = point;
    return;
  }

  function beginFreehandDrawing(point) {

    isTrailDragging = true;
    document.body.classList.add("trail-drawing-active");
    mapElement.classList.add("is-trail-drawing");

    pushUndo(`draft ${drawingLabel()} drag`);
    draftDrawingSource = "drag";

    if (state.mode === "route") {
      state.drawPoints = [];
    }

    state.draftFeature = null;
    state.selectedId = null;

    addDragDrawPoint(point, state.mode === "range" ? 7 : 0);
    renderAll();
    setStatus(`Drawing ${drawingLabel()}. Release left click to stop.`);
  }

  function continueTrailDrag(event) {
    if (!isDrawingMode()) return;

    const point = eventToImagePoint(event);
    if (!imagePointIsInside(point)) return;

    if (!isTrailDragging && pendingDrawingDragPoint) {
      if (screenDistanceBetweenImagePoints(pendingDrawingDragPoint, point) < 8) return;

      event.preventDefault();
      event.stopPropagation();
      beginFreehandDrawing(pendingDrawingDragPoint);
    }

    if (!isTrailDragging) return;

    event.preventDefault();

    if (addDragDrawPoint(point)) {
      renderDomOverlay();
      const label = drawingLabel();
      setStatus(`${state.drawPoints.length} ${label} point${state.drawPoints.length === 1 ? "" : "s"} recorded`);
    }
  }

  function stopTrailDrag(event) {
    pendingDrawingDragPoint = null;

    if (!isTrailDragging) return;

    event?.preventDefault?.();

    isTrailDragging = false;
    lastDragEndedAt = Date.now();
    document.body.classList.remove("trail-drawing-active");
    mapElement.classList.remove("is-trail-drawing");

    const isRange = state.mode === "range";
    const minimum = isRange ? 3 : 2;
    const label = drawingLabel();

    if (state.drawPoints.length < minimum) {
      cancelDrawing(false);
      renderAll();
      setStatus(isRange ? "Range needs at least 3 points." : "Trail needs at least 2 points.");
      return;
    }

    renderAll();
    setStatus(`${label[0].toUpperCase()}${label.slice(1)} draft recorded. Use the checkmark to save or X to discard.`);
  }

  function handleMapClick(event) {
    const target = event.originalEvent?.target;
    if (target?.closest?.(".dom-entry, .dom-draft-actions, .custom-zoom, .tool-panel, .ledger-panel, .atlas-header")) return;

    if (Date.now() - lastDragEndedAt < 140) return;

    if (state.mode === "select" && state.selectedId) {
      selectFeature(null);
      setStatus("Selection cleared.");
      return;
    }

    const point = eventToImagePoint(event);

    if (!imagePointIsInside(point)) {
      setStatus("Click inside the map image to place entries.");
      return;
    }

    if (state.mode === "marker") {
      pushUndo("draft mark placement");
      state.draftFeature = createFeature({
        type: "marker",
        category: "landmark",
        title: "New mark",
        points: [point]
      });
      state.drawPoints = [point];
      draftDrawingSource = "click";
      state.selectedId = state.draftFeature.id;
      renderAll();
      setStatus("Draft mark placed. Use the checkmark beside it to save.");
      return;
    }

    if (state.mode === "route") {
      pushUndo("draft trail point");
      draftDrawingSource = "click";
      state.drawPoints.push(point);
      renderAll();
      setStatus(`${state.drawPoints.length} trail point${state.drawPoints.length === 1 ? "" : "s"} placed`);
      return;
    }

    if (state.mode === "range") {
      pushUndo("draft range point");
      draftDrawingSource = "click";
      state.drawPoints.push(point);
      renderAll();
      setStatus(`${state.drawPoints.length} range point${state.drawPoints.length === 1 ? "" : "s"} placed`);
    }
  }

  function createFeature({ type, category, title, points }) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `feature-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      category,
      title,
      confidence: "scouted",
      creator: currentCreator(),
      notes: "",
      points,
      source: "personal",
      createdAt: now,
      updatedAt: now
    };
  }

  function clampZoom(zoom) {
    const min = map.getMinZoom();
    const max = map.getMaxZoom();
    return Math.max(min, Math.min(max, zoom));
  }

  function centerContainerPoint() {
    return map.getSize().divideBy(2);
  }

  function eventToContainerPoint(event) {
    const rect = mapElement.getBoundingClientRect();

    return L.point(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }

  function normalizeWheelZoomDelta(event) {
    let deltaY = event.deltaY;

    if (event.deltaMode === 1) deltaY *= 16;
    if (event.deltaMode === 2) deltaY *= window.innerHeight;

    // Negative deltaY means wheel up / zoom in. Positive means zoom out.
    const raw = -deltaY / 420;
    return Math.max(-0.42, Math.min(0.42, raw));
  }

  function handleSmoothWheel(event) {
    if (event.ctrlKey || event.metaKey) return;
    if (shouldIgnoreDrawingTarget(event.target)) return;

    event.preventDefault();
    event.stopPropagation();

    const amount = normalizeWheelZoomDelta(event);
    if (!amount) return;

    smoothZoomBy(amount, eventToContainerPoint(event));
  }

  function smoothZoomBy(amount, anchorPoint = centerContainerPoint()) {
    const current = map.getZoom();
    const startTarget = smoothZoomTarget ?? current;
    const nextTarget = clampZoom(startTarget + amount);

    if (Math.abs(nextTarget - current) < 0.001 && Math.abs(nextTarget - startTarget) < 0.001) return;

    smoothZoomTarget = nextTarget;
    smoothZoomAnchor = anchorPoint;

    isCustomSmoothZooming = true;
    isMapZooming = true;
    domLayer.classList.add("is-map-zooming");

    if (smoothZoomIdleTimer) {
      clearTimeout(smoothZoomIdleTimer);
      smoothZoomIdleTimer = 0;
    }

    if (!smoothZoomFrame) {
      smoothZoomFrame = requestAnimationFrame(stepSmoothZoom);
    }
  }

  function stepSmoothZoom() {
    smoothZoomFrame = 0;

    if (smoothZoomTarget === null || !smoothZoomAnchor) {
      finishSmoothZoom();
      return;
    }

    const current = map.getZoom();
    const diff = smoothZoomTarget - current;

    if (Math.abs(diff) < 0.003) {
      map.setZoomAround(smoothZoomAnchor, smoothZoomTarget, { animate: false });
      renderDomOverlay();
      smoothZoomIdleTimer = setTimeout(finishSmoothZoom, 90);
      return;
    }

    const next = current + diff * 0.24;
    map.setZoomAround(smoothZoomAnchor, next, { animate: false });
    renderDomOverlay();

    smoothZoomFrame = requestAnimationFrame(stepSmoothZoom);
  }

  function finishSmoothZoom() {
    if (smoothZoomFrame) {
      cancelAnimationFrame(smoothZoomFrame);
      smoothZoomFrame = 0;
    }

    smoothZoomTarget = null;
    smoothZoomAnchor = null;
    smoothZoomIdleTimer = 0;
    isCustomSmoothZooming = false;
    isMapZooming = false;

    scheduleOverlayRender();
    requestAnimationFrame(() => domLayer.classList.remove("is-map-zooming"));
  }

  function renderAll() {
    renderCreatorFilter();
    renderDomOverlay();
    renderFeatureList();
    renderEditor();
  }

  function scheduleOverlayRender() {
    if (overlayTimeout) {
      clearTimeout(overlayTimeout);
      overlayTimeout = 0;
    }

    if (overlayFrame) return;

    overlayFrame = requestAnimationFrame(() => {
      overlayFrame = 0;
      renderDomOverlay();
    });
  }

  function renderDomOverlay() {
    domLayer.innerHTML = "";

    const rect = baseImageRect();
    if (!rect) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    domLayer.appendChild(svg);

    visibleFeatures()
      .slice()
      .sort(compareFeaturesForMap)
      .forEach(feature => renderDomFeature(feature, svg));

    renderDomDraft(svg);
  }

  function featureTooltipAnchorHtml(feature) {
    return tooltipHtml(feature);
  }

  function draftTrailTooltipHtml() {
    const creator = currentCreator();
    const count = state.drawPoints.length;
    return `
      <span class="dom-tooltip">
        <span class="tooltip-title">Draft trail</span><br>
        <span class="tooltip-by">Mapped by ${escapeHtml(creator)}</span><br>
        <span class="tooltip-time">${count} point${count === 1 ? "" : "s"} recorded</span>
      </span>
    `;
  }

  function midpointScreen(points) {
    if (!points.length) return null;
    if (points.length === 1) return points[0];

    let bestIndex = Math.floor(points.length / 2);
    let total = 0;
    const distances = [];

    for (let index = 1; index < points.length; index++) {
      const distance = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
      distances.push(distance);
      total += distance;
    }

    if (total <= 0) return points[bestIndex];

    let walked = 0;
    const half = total / 2;

    for (let index = 1; index < points.length; index++) {
      const distance = distances[index - 1];

      if (walked + distance >= half) {
        const ratio = distance ? (half - walked) / distance : 0;
        return {
          x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
          y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio
        };
      }

      walked += distance;
    }

    return points[bestIndex];
  }

  function addPathTooltipAnchor(feature, points, linkedElements = []) {
    const midpoint = midpointScreen(points);
    if (!midpoint) return;

    const anchor = document.createElement("div");
    anchor.className = "dom-entry dom-path-tooltip-anchor";
    anchor.style.left = `${midpoint.x}px`;
    anchor.style.top = `${midpoint.y}px`;
    anchor.innerHTML = featureTooltipAnchorHtml(feature);

    const show = () => anchor.classList.add("is-active");
    const hide = () => anchor.classList.remove("is-active");

    linkedElements.forEach(element => {
      element.classList.add("dom-path-hover");
      element.addEventListener("mouseenter", show);
      element.addEventListener("mouseleave", hide);
      element.addEventListener("focus", show);
      element.addEventListener("blur", hide);
    });

    domLayer.appendChild(anchor);
  }

  function addDraftTrailTooltipAnchor(points) {
    const midpoint = midpointScreen(points);
    if (!midpoint) return;

    const anchor = document.createElement("div");
    anchor.className = "dom-entry dom-path-tooltip-anchor is-active";
    anchor.style.left = `${midpoint.x}px`;
    anchor.style.top = `${midpoint.y}px`;
    anchor.innerHTML = draftTrailTooltipHtml();

    domLayer.appendChild(anchor);
  }



  function getCategorySigilSrc(categoryId) {
    return CATEGORY_SIGIL_FILES[categoryId] || CATEGORY_SIGIL_FILES.landmark;
  }

  function ensureSigilImage(categoryId) {
    const src = getCategorySigilSrc(categoryId);
    if (!sigilImageCache[src]) {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.addEventListener("load", () => scheduleOverlayRender());
      img.src = src;
      sigilImageCache[src] = img;
    }
    return sigilImageCache[src];
  }

  function preloadSigilImages() {
    Object.keys(CATEGORY_SIGIL_FILES).forEach(ensureSigilImage);
  }

  function markerSigilHtml(categoryId) {
    const src = getCategorySigilSrc(categoryId);
    ensureSigilImage(categoryId);
    const circleClass = categoryId === "route"
      ? " marker-sigil-circle-route"
      : categoryId === "post"
        ? " marker-sigil-circle-post"
        : "";
    const style = getSigilStyle(categoryId);
    return `
      <span class="marker-sigil-circle${circleClass}">
        <img class="marker-sigil-image" style="${style}" src="${src}" alt="" aria-hidden="true" draggable="false">
      </span>
    `;
  }

  function drawCanvasSigilMarker(ctx, categoryId, point, color) {
    const accent = color || "#5d5950";
    const fill = accent;
    const img = ensureSigilImage(categoryId);

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (img && img.complete && img.naturalWidth && img.naturalHeight) {
      const fit = getSigilFit(categoryId);
      const scale = Math.min(fit.maxSize / img.naturalWidth, fit.maxSize / img.naturalHeight);
      let width = Math.max(1, img.naturalWidth * scale) * fit.scaleX;
      let height = Math.max(1, img.naturalHeight * scale) * fit.scaleY;

      const clipRadius = 19.25;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, clipRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -width / 2 + fit.offsetX, -height / 2 + fit.offsetY, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = "#151515";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function renderDomFeature(feature, svg) {
    const category = categoryById[feature.category] || categoryById.landmark;
    const selected = feature.id === state.selectedId;

    if (feature.type === "marker") {
      const point = feature.points[0];
      const screen = imagePointToScreen(point);
      if (!screen) return;

      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = `dom-entry dom-marker-circle${selected ? " is-selected" : ""}`;
      marker.style.left = `${screen.x}px`;
      marker.style.top = `${screen.y}px`;
      marker.style.setProperty("--marker-accent", category.color);
      marker.style.setProperty("--marker-fill", category.color);
      marker.setAttribute("aria-label", feature.title || "Map mark");

      marker.innerHTML = `${markerSigilHtml(feature.category)}${tooltipHtml(feature)}`;

      marker.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectFeature(feature.id);
      });

      domLayer.appendChild(marker);
      return;
    }

    const points = feature.points.map(imagePointToScreen).filter(Boolean);
    if (points.length < 2) return;

    if (feature.type === "route") {
      const under = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      under.setAttribute("points", pointsToString(points));
      under.setAttribute("fill", "none");
      under.setAttribute("stroke", "#efe3c2");
      under.setAttribute("stroke-width", selected ? "10" : "8");
      under.setAttribute("stroke-opacity", "0.55");
      under.setAttribute("stroke-linecap", "round");
      under.setAttribute("stroke-linejoin", "round");
      under.classList.add("route-line");
      under.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectFeature(feature.id);
      });
      svg.appendChild(under);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", pointsToString(points));
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", category.color);
      line.setAttribute("stroke-width", selected ? "4" : "3");
      line.setAttribute("stroke-opacity", selected ? "0.96" : "0.84");
      line.setAttribute("stroke-dasharray", "18 16 4 16");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      line.classList.add("route-line");
      line.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectFeature(feature.id);
      });
      svg.appendChild(line);

      const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      hitbox.setAttribute("points", pointsToString(points));
      hitbox.setAttribute("fill", "none");
      hitbox.setAttribute("stroke", "#ffffff");
      hitbox.setAttribute("stroke-width", selected ? "28" : "24");
      hitbox.setAttribute("stroke-opacity", "0");
      hitbox.setAttribute("stroke-linecap", "round");
      hitbox.setAttribute("stroke-linejoin", "round");
      hitbox.classList.add("route-click-target");
      hitbox.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectFeature(feature.id);
      });
      svg.appendChild(hitbox);

      addPathTooltipAnchor(feature, points, [under, line, hitbox]);
      return;
    }

    if (feature.type === "range") {
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", pointsToString(points));
      polygon.setAttribute("fill", category.color);
      polygon.setAttribute("fill-opacity", selected ? "0.18" : "0.12");
      polygon.setAttribute("stroke", category.color);
      polygon.setAttribute("stroke-width", selected ? "4" : "2.5");
      polygon.setAttribute("stroke-opacity", selected ? "0.95" : "0.78");
      polygon.classList.add("range-fill");
      polygon.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectFeature(feature.id);
      });
      svg.appendChild(polygon);

      addPathTooltipAnchor(feature, points, [polygon]);
    }
  }

  function renderDomDraft(svg) {
    if (!state.drawPoints.length && !state.draftFeature) return;

    if (state.draftFeature?.type === "marker") {
      const category = categoryById[state.draftFeature.category] || categoryById.landmark;
      const point = state.draftFeature.points[0];
      const screen = imagePointToScreen(point);
      if (!screen) return;

      const marker = document.createElement("div");
      marker.className = "dom-entry dom-marker-circle is-selected";
      marker.style.left = `${screen.x}px`;
      marker.style.top = `${screen.y}px`;
      marker.style.setProperty("--marker-accent", category.color);
      marker.style.setProperty("--marker-fill", category.color);
      marker.innerHTML = markerSigilHtml(state.draftFeature.category);
      domLayer.appendChild(marker);

      addDraftControls(screen);
      return;
    }

    const isRange = state.mode === "range";
    const category = categoryById[isRange ? "range" : "route"];
    const points = state.drawPoints.map(imagePointToScreen).filter(Boolean);

    if (draftDrawingSource !== "drag") {
      points.forEach(screen => {
        const dot = document.createElement("div");
        dot.className = "dom-entry dom-marker";
        dot.style.width = "13px";
        dot.style.height = "13px";
        dot.style.borderWidth = "2px";
        dot.style.left = `${screen.x}px`;
        dot.style.top = `${screen.y}px`;
        dot.style.backgroundColor = category.color;
        domLayer.appendChild(dot);
      });
    }

    if (points.length > 1) {
      const shape = document.createElementNS("http://www.w3.org/2000/svg", isRange ? "polygon" : "polyline");
      shape.setAttribute("points", pointsToString(points));
      shape.setAttribute("fill", isRange ? category.color : "none");
      shape.setAttribute("fill-opacity", isRange ? "0.14" : "0");
      shape.setAttribute("stroke", category.color);
      shape.setAttribute("stroke-width", isRange ? "2.5" : "4");
      shape.setAttribute("stroke-opacity", "0.86");
      shape.setAttribute("stroke-dasharray", isRange ? "8 10" : "12 10");
      shape.setAttribute("stroke-linecap", "round");
      shape.setAttribute("stroke-linejoin", "round");
      svg.appendChild(shape);
    }

    if (!isRange && points.length > 1) {
      addDraftTrailTooltipAnchor(points);
    }

    addDraftControls(points[points.length - 1]);
  }

  function addDraftControls(screen) {
    if (!screen) return;

    const controls = document.createElement("div");
    controls.className = "dom-draft-actions";
    controls.style.left = `${screen.x}px`;
    controls.style.top = `${screen.y}px`;
    controls.innerHTML = `
      <button class="keep" title="Save draft" type="button">✓</button>
      <button class="drop" title="Discard draft" type="button">×</button>
    `;

    controls.querySelector(".keep").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      saveDraftFeature();
    });

    controls.querySelector(".drop").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      cancelDrawing();
      renderAll();
    });

    domLayer.appendChild(controls);
  }

  function saveDraftFeature() {
    if (!state.draftFeature && !state.drawPoints.length) return;

    if (state.draftFeature?.type === "marker") {
      const feature = cloneFeature(state.draftFeature);
      feature.updatedAt = new Date().toISOString();

      pushUndo("mark save");
      state.features.push(feature);
      state.filters[feature.category] = true;

      cancelDrawing(false);
      saveState();
      renderAll();
      selectFeature(feature.id);
      setMode("select");
      setStatus(`Created ${feature.title}`);
      return;
    }

    finishDrawing();
  }

  function finishDrawing() {
    if (state.draftFeature?.type === "marker") {
      saveDraftFeature();
      return;
    }

    if (state.mode !== "range" && state.mode !== "route") return;

    const isRange = state.mode === "range";
    const minimum = isRange ? 3 : 2;

    if (state.drawPoints.length < minimum) {
      setStatus(isRange ? "Range needs at least 3 points" : "Trail needs at least 2 points");
      return;
    }

    const feature = createFeature({
      type: isRange ? "range" : "route",
      category: isRange ? "range" : "route",
      title: isRange ? "New range" : "New trail",
      points: state.drawPoints.slice()
    });

    pushUndo(`${isRange ? "range" : "trail"} save`);
    state.features.push(feature);
    state.filters[feature.category] = true;

    cancelDrawing(false);
    saveState();
    renderAll();
    selectFeature(feature.id);
    setMode("select");
    setStatus(`Created ${feature.title}`);
  }

  function cancelDrawing(showStatus = true) {
    isTrailDragging = false;
    document.body.classList.remove("trail-drawing-active");
    mapElement.classList.remove("is-trail-drawing");

    const draftId = state.draftFeature?.id;
    if (draftId && state.selectedId === draftId) state.selectedId = null;

    state.drawPoints = [];
    state.draftFeature = null;
    draftDrawingSource = "click";

    if (showStatus) setStatus("Draft discarded");
    renderDomOverlay();
  }

  function renderEditor() {
    const feature = selectedFeature();

    if (!feature) {
      el.emptySelection.classList.remove("hidden");
      el.editorForm.classList.add("hidden");
      return;
    }

    el.emptySelection.classList.add("hidden");
    el.editorForm.classList.remove("hidden");

    el.featureId.value = feature.id;
    el.titleInput.value = feature.title || "";
    el.categoryInput.value = feature.category || "landmark";
    el.confidenceInput.value = feature.confidence || "scouted";
    el.creatorMeta.value = feature.creator || "Unknown";
    el.notesInput.value = feature.notes || "";
  }

  function readEditorValues() {
    return {
      title: limitText(el.titleInput.value.trim() || "Untitled", SECURITY_LIMITS.maxTitleChars),
      category: el.categoryInput.value || "landmark",
      confidence: el.confidenceInput.value || "scouted",
      notes: limitText(el.notesInput.value.trim(), SECURITY_LIMITS.maxNotesChars)
    };
  }

  function applyEditorValues(feature, values) {
    feature.title = values.title;
    feature.category = values.category;
    feature.confidence = values.confidence;
    feature.notes = values.notes;
    feature.updatedAt = new Date().toISOString();
  }

  function saveSelectedFeature() {
    const feature = selectedFeature();
    if (!feature) return;

    const values = readEditorValues();

    pushUndo("entry edit");
    applyEditorValues(feature, values);

    if (state.draftFeature && state.draftFeature.id === feature.id) {
      state.draftFeature = feature;
    } else {
      saveState();
    }

    renderAll();
    setStatus(`Saved ${feature.title}`);
  }

  function deleteSelectedFeature() {
    const feature = selectedFeature();
    if (!feature) return;

    if (!confirm(`Delete "${feature.title || "Untitled"}"?`)) return;

    pushUndo("entry delete");
    state.features = state.features.filter(item => item.id !== feature.id);
    state.selectedId = null;
    saveState();
    renderAll();
    setStatus("Entry deleted");
  }

  function selectFeature(id) {
    state.selectedId = id;
    renderAll();
  }

  function selectedFeature() {
    if (state.draftFeature && state.draftFeature.id === state.selectedId) return state.draftFeature;
    return state.features.find(feature => feature.id === state.selectedId) || null;
  }

  function renderFilters() {
    el.categoryFilters.innerHTML = "";

    categories.forEach(category => {
      const label = document.createElement("label");
      label.className = "category-check";
      label.innerHTML = `
        <span class="category-dot" style="background:${category.color}"></span>
        <span>${escapeHtml(category.label)}</span>
        <input type="checkbox" ${state.filters[category.id] !== false ? "checked" : ""}>
      `;

      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        state.filters[category.id] = input.checked;
        saveState();
        renderAll();
      });

      el.categoryFilters.appendChild(label);
    });
  }

  function renderCreatorFilter() {
    const current = el.creatorFilterInput.value;
    const names = [...new Set(state.features.map(feature => feature.creator || "Unknown"))].sort();

    el.creatorFilterInput.innerHTML = `<option value="">Anyone</option>` +
      names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");

    el.creatorFilterInput.value = names.includes(current) ? current : "";
  }

  function renderFeatureList() {
    const features = visibleFeatures();

    if (!features.length) {
      el.featureList.innerHTML = `<p class="feature-meta">No visible entries.</p>`;
      return;
    }

    el.featureList.innerHTML = "";

    features.forEach(feature => {
      const category = categoryById[feature.category] || categoryById.landmark;
      const card = document.createElement("div");
      card.className = "feature-card" + (feature.id === state.selectedId ? " is-selected" : "");
      card.style.setProperty("--entry-color", category.color);
      card.innerHTML = `
        <div class="feature-title">${escapeHtml(feature.title || "Untitled")}</div>
        <div class="feature-meta">
          ${escapeHtml(category.label)} · ${escapeHtml(relativeTime(feature.updatedAt))}<br>
          Mapped by ${escapeHtml(feature.creator || "Unknown")}<br>
          ${escapeHtml(previewText(feature.notes))}
        </div>
      `;

      card.addEventListener("click", () => {
        selectFeature(feature.id);
        zoomToFeature(feature);
      });

      el.featureList.appendChild(card);
    });
  }

  function visibleFeatures() {
    return state.features.filter(feature => {
      const categoryOk = state.filters[feature.category] !== false;
      const creatorOk = !state.creatorFilter || feature.creator === state.creatorFilter;
      const hay = `${feature.title || ""} ${feature.notes || ""} ${feature.creator || ""}`.toLowerCase();
      const searchOk = !state.search || hay.includes(state.search);
      return categoryOk && creatorOk && searchOk;
    });
  }

  function compareFeaturesForMap(a, b) {
    const order = { range: 0, route: 1, marker: 2 };
    return (order[a.type] ?? 9) - (order[b.type] ?? 9);
  }

  function zoomToFeature(feature) {
    const points = feature.points || [];
    if (!points.length) return;

    const latLngs = points.map(imagePointToLatLng);

    if (feature.type === "marker") {
      map.setView(latLngs[0], Math.max(map.getZoom(), 0.25), { animate: true });
      return;
    }

    map.fitBounds(latLngs, {
      paddingTopLeft: [220, 80],
      paddingBottomRight: [360, 80]
    });
  }

  function pushUndo(label) {
    state.undoStack.push({
      label,
      features: state.features.map(cloneFeature),
      selectedId: state.selectedId
    });

    if (state.undoStack.length > 50) state.undoStack.shift();
    updateUndoButton();
  }

  function undoLastAction() {
    const snapshot = state.undoStack.pop();
    updateUndoButton();

    if (!snapshot) {
      setStatus("Nothing to undo");
      return;
    }

    state.features = snapshot.features.map(cloneFeature);
    state.selectedId = snapshot.selectedId;
    state.drawPoints = [];
    state.draftFeature = null;

    saveState();
    renderAll();
    setStatus(`Undid ${snapshot.label}`);
  }

  function updateUndoButton() {
    el.undoBtn.disabled = state.undoStack.length === 0;
  }

  // ---------------------------------------------------------------------------
  // Share / Receive
  // ---------------------------------------------------------------------------

  // Share dialog controls.
  function openShareDialog() {
    renderShareFeatureList();
    updateShareSelectionSummary();
    updateShortShareStatus();
    el.shareDialog.showModal();
  }

  function renderShareFeatureList() {
    const shareable = getShareableFeatures();

    if (!shareable.length) {
      el.shareFeatureList.innerHTML = `<p class="feature-meta">No entries to share yet.</p>`;
      updateShareSelectionSummary();
      return;
    }

    el.shareFeatureList.innerHTML = "";

    shareable.forEach(feature => {
      const category = categoryById[feature.category] || categoryById.landmark;
      const row = document.createElement("label");
      row.className = "share-feature-row";
      row.style.setProperty("--entry-color", category.color);
      row.innerHTML = `
        <input type="checkbox" class="share-feature-check" value="${escapeHtml(feature.id)}" checked>
        <span class="share-feature-text">
          <strong>${escapeHtml(feature.title || "Untitled")}</strong>
          <small>${escapeHtml(typeLabel(feature.type))} · ${escapeHtml(category.label)} · ${escapeHtml(feature.creator || "Unknown")}</small>
        </span>
      `;

      row.querySelector("input").addEventListener("change", updateShareSelectionSummary);
      el.shareFeatureList.appendChild(row);
    });
  }

  function getShareableFeatures() {
    return state.features
      .map(normalizeFeature)
      .filter(Boolean)
      .filter(feature => feature.source !== "canon" && feature.source !== "system" && feature.source !== "guild");
  }

  function selectedShareFeatures() {
    const selectedIds = new Set([...el.shareFeatureList.querySelectorAll(".share-feature-check:checked")].map(input => input.value));
    return getShareableFeatures().filter(feature => selectedIds.has(feature.id));
  }

  function setShareSelection(checked) {
    el.shareFeatureList.querySelectorAll(".share-feature-check").forEach(input => {
      input.checked = checked;
    });

    updateShareSelectionSummary();
  }

  function updateShareSelectionSummary() {
    const total = getShareableFeatures().length;
    const selected = selectedShareFeatures().length;
    el.shareSelectionSummary.textContent = `${selected} of ${total} entr${total === 1 ? "y" : "ies"} selected.`;
  }

  function updateShortShareStatus() {
    if (!el.shortShareStatus) return;

    if (isShortCodeConfigured()) {
      el.shortShareStatus.textContent = "Online share codes are enabled.";
      el.copyShortShareBtn.disabled = false;
    } else {
      el.shortShareStatus.textContent = "Share codes require Supabase setup in atlas-config.js.";
      el.copyShortShareBtn.disabled = false;
    }
  }

  function isShortCodeConfigured() {
    return Boolean(
      SUPABASE_CONFIG.enabled &&
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      SUPABASE_CONFIG.table
    );
  }

  function normalizeShortCodeInput(value) {
    return String(value || "").trim().replace(/[\s-]/g, "").toUpperCase();
  }

  function isShortCodeInput(value) {
    return SHORT_CODE_PATTERN.test(normalizeShortCodeInput(value));
  }

  function generateShortCode() {
    const bytes = new Uint8Array(SHORT_CODE_LENGTH);
    crypto.getRandomValues(bytes);

    return [...bytes]
      .map(byte => SHORT_CODE_ALPHABET[byte % SHORT_CODE_ALPHABET.length])
      .join("");
  }

  function supabaseRestBaseUrl() {
    return String(SUPABASE_CONFIG.url || "").replace(/\/+$/, "") + "/rest/v1";
  }

  function supabaseTableUrl() {
    return `${supabaseRestBaseUrl()}/${encodeURIComponent(SUPABASE_CONFIG.table)}`;
  }

  function supabaseHeaders(extra = {}) {
    return {
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      ...extra
    };
  }

  function databaseSharePayload(features) {
    const cleanFeatures = features.map(normalizeFeature).filter(Boolean);

    return {
      v: 3,
      app: "Wanderer’s Atlas",
      format: "short-code-payload",
      w: MAP_WIDTH,
      h: MAP_HEIGHT,
      exportedAt: new Date().toISOString(),
      features: cleanFeatures.map(feature => ({
        id: feature.id || uniqueId(),
        type: feature.type,
        category: feature.category,
        title: limitText(feature.title || "Untitled", SECURITY_LIMITS.maxTitleChars),
        confidence: feature.confidence || "scouted",
        creator: limitText(feature.creator || "Unknown", SECURITY_LIMITS.maxCreatorChars),
        notes: limitText(feature.notes || "", SECURITY_LIMITS.maxNotesChars),
        points: (feature.points || [])
          .slice(0, SECURITY_LIMITS.maxPointsPerFeature)
          .map(point => ({ x: roundPoint(point.x), y: roundPoint(point.y) })),
        source: "personal",
        createdAt: feature.createdAt || new Date().toISOString(),
        updatedAt: feature.updatedAt || feature.createdAt || new Date().toISOString()
      }))
    };
  }

  function payloadByteLength(payload) {
    return new Blob([JSON.stringify(payload)]).size;
  }

  function shortCodeExpiresAt() {
    const days = Number(SUPABASE_CONFIG.expiresDays);

    if (!Number.isFinite(days) || days <= 0) return null;

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  async function saveShortSharePayload(payload) {
    if (!isShortCodeConfigured()) {
      throw new Error("Share codes are not configured yet. Fill in atlas-config.js and run supabase-schema.sql in Supabase.");
    }

    const bodyBase = {
      payload,
      expires_at: shortCodeExpiresAt(),
      app_version: "wanderers-atlas-mark-5"
    };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateShortCode();
      const response = await fetch(supabaseTableUrl(), {
        method: "POST",
        headers: supabaseHeaders({
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        }),
        body: JSON.stringify({ ...bodyBase, code })
      });

      if (response.ok) return code;

      const text = await response.text();

      if (response.status === 409) {
        continue;
      }

      throw new Error(readableSupabaseError(text, "Could not save the short code."));
    }

    throw new Error("Could not create a unique short code. Try again.");
  }

  async function fetchShortSharePayload(code) {
    if (!isShortCodeConfigured()) {
      throw new Error("Share codes are not configured yet. Fill in atlas-config.js and run supabase-schema.sql.");
    }

    const normalizedCode = normalizeShortCodeInput(code);
    const url = `${supabaseTableUrl()}?code=eq.${encodeURIComponent(normalizedCode)}&select=payload,created_at,expires_at&limit=1`;
    const response = await fetch(url, {
      method: "GET",
      headers: supabaseHeaders({
        Accept: "application/json"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(readableSupabaseError(text, "Could not retrieve that short code."));
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || !rows.length) {
      throw new Error("No shared entries were found for that code.");
    }

    const row = rows[0];

    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("That code has expired.");
    }

    return row.payload;
  }

  function readableSupabaseError(text, fallback) {
    if (!text) return fallback;

    try {
      const parsed = JSON.parse(text);
      return parsed.message || parsed.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
  }

  async function copyShortShareCode() {
    const features = selectedShareFeatures();

    if (!features.length) {
      alert("Select at least one entry to share.");
      return;
    }

    if (!isShortCodeConfigured()) {
      alert("Share codes need Supabase setup first. Fill in atlas-config.js, run supabase-schema.sql, then upload again.");
      return;
    }

    const payload = databaseSharePayload(features);

    if (payload.features.length > SECURITY_LIMITS.maxImportEntries) {
      alert(`Too many entries. Limit: ${SECURITY_LIMITS.maxImportEntries}.`);
      return;
    }

    if (payloadByteLength(payload) > SECURITY_LIMITS.maxShareCodeChars) {
      alert(`This share is too large. Select fewer entries or shorten long notes. Limit: ${formatBytes(SECURITY_LIMITS.maxShareCodeChars)}.`);
      return;
    }

    el.copyShortShareBtn.disabled = true;
    const originalText = el.copyShortShareBtn.textContent;
    el.copyShortShareBtn.textContent = "Creating...";

    try {
      const code = await saveShortSharePayload(payload);
      await copyTextToClipboard(code);
      setStatus(`Share code copied: ${code}`);
    } catch (error) {
      console.error("Short code creation failed", error);
      alert(error.message || "Could not create a share code.");
      setStatus("Could not create share code.");
    } finally {
      el.copyShortShareBtn.disabled = false;
      el.copyShortShareBtn.textContent = originalText;
    }
  }

  function encodeCompactFeature(feature) {
    return [
      feature.id || uniqueId(),
      encodeFeatureType(feature.type),
      feature.category || "landmark",
      feature.title || "Untitled",
      feature.confidence || "scouted",
      feature.creator || "Unknown",
      feature.notes || "",
      (feature.points || []).map(point => [roundPoint(point.x), roundPoint(point.y)]),
      feature.source || "personal",
      feature.createdAt || new Date().toISOString(),
      feature.updatedAt || feature.createdAt || new Date().toISOString()
    ];
  }

  function roundPoint(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function encodePayload(payload) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function openReceiveDialog() {
    state.pendingReceive = null;
    state.pendingReceiveMeta = null;
    el.receiveCodeInput.value = "";
    el.receivePreview.textContent = "";
    el.receiveMergeBtn.disabled = true;
    el.receiveReplaceBtn.disabled = true;
    el.receiveDialog.showModal();
  }

  async function reviewReceiveCode() {
    const raw = el.receiveCodeInput.value.trim();

    if (!raw) {
      alert("Paste an atlas code first.");
      return;
    }

    if (raw.length > SECURITY_LIMITS.maxShareCodeChars) {
      state.pendingReceive = null;
      state.pendingReceiveMeta = null;
      el.receivePreview.textContent = `Code is too large. Limit: ${formatBytes(SECURITY_LIMITS.maxShareCodeChars)}.`;
      el.receiveMergeBtn.disabled = true;
      el.receiveReplaceBtn.disabled = true;
      alert(`That code is too large. Limit: ${formatBytes(SECURITY_LIMITS.maxShareCodeChars)}.`);
      return;
    }

    try {
      const result = await parseReceiveInput(raw);
      result.duplicates = findPotentialDuplicates(state.features, result.features);
      state.pendingReceive = result.features;
      state.pendingReceiveMeta = result;
      renderReceivePreview(result);
      el.receiveMergeBtn.disabled = result.features.length === 0;
      el.receiveReplaceBtn.disabled = result.features.length === 0;
      setStatus(`${result.features.length} received entr${result.features.length === 1 ? "y" : "ies"} reviewed.`);
    } catch (error) {
      console.error("Receive review failed", error);
      state.pendingReceive = null;
      state.pendingReceiveMeta = null;
      el.receivePreview.textContent = error.message || "Could not read that atlas code.";
      el.receiveMergeBtn.disabled = true;
      el.receiveReplaceBtn.disabled = true;
      alert(error.message || "Could not read that atlas code.");
    }
  }

  // Receive parsing and validation.
  async function parseReceiveInput(raw) {
    const trimmed = String(raw || "").trim();

    if (trimmed.length > SECURITY_LIMITS.maxShareCodeChars) {
      throw new Error(`Code is too large. Limit: ${formatBytes(SECURITY_LIMITS.maxShareCodeChars)}.`);
    }

    if (!isShortCodeInput(trimmed)) {
      throw new Error("Enter a valid 7-character share code.");
    }

    const payload = await fetchShortSharePayload(trimmed);
    return normalizeReceivePayload(payload);
  }

  function normalizeReceivePayload(payload) {
    const warnings = [];

    if (Array.isArray(payload)) {
      payload = { features: payload };
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid atlas code.");
    }

    if (Number(payload.w) && Number(payload.w) !== MAP_WIDTH) {
      warnings.push("Map width does not match this atlas.");
    }

    if (Number(payload.h) && Number(payload.h) !== MAP_HEIGHT) {
      warnings.push("Map height does not match this atlas.");
    }

    const rawFeatures = Array.isArray(payload.features)
      ? payload.features
      : [];

    if (!rawFeatures.length) {
      throw new Error("No entries were found in that code.");
    }

    if (rawFeatures.length > SECURITY_LIMITS.maxImportEntries) {
      throw new Error(`Too many entries. Limit: ${SECURITY_LIMITS.maxImportEntries}.`);
    }

    const features = [];
    const skipped = [];

    rawFeatures.forEach((rawFeature, index) => {
      const result = normalizeReceivedFeature(rawFeature, index + 1);

      if (result.feature) features.push(result.feature);
      if (result.warning) warnings.push(result.warning);
      if (result.skipped) skipped.push(result.skipped);
    });

    if (!features.length) {
      throw new Error("No valid entries were found in that code.");
    }

    return {
      app: limitText(payload.app || "Unknown Atlas", 80),
      version: payload.v || payload.version || 1,
      exportedAt: limitText(payload.exportedAt || payload.savedAt || "", 40),
      features,
      warnings,
      skipped,
      duplicates: []
    };
  }

  function normalizeReceivedFeature(rawFeature, index) {
    if (!rawFeature || typeof rawFeature !== "object") {
      return { skipped: `Entry ${index} skipped: invalid entry.` };
    }

    if (String(rawFeature.source || "").toLowerCase() === "guild") {
      return { skipped: `Entry ${index} skipped: Guild entries are not accepted.` };
    }

    const rawPoints = Array.isArray(rawFeature.points) ? rawFeature.points : [];

    if (rawPoints.length > SECURITY_LIMITS.maxPointsPerFeature) {
      return { skipped: `Entry ${index} skipped: too many points (${rawPoints.length}). Limit: ${SECURITY_LIMITS.maxPointsPerFeature}.` };
    }

    const type = ["marker", "route", "range"].includes(rawFeature.type) ? rawFeature.type : "marker";
    const minPoints = type === "range" ? 3 : type === "route" ? 2 : 1;

    const cleanPoints = rawPoints
      .map(point => ({ x: Number(point.x), y: Number(point.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      .filter(imagePointIsInside)
      .slice(0, SECURITY_LIMITS.maxPointsPerFeature);

    if (cleanPoints.length < minPoints) {
      return { skipped: `Entry ${index} skipped: ${typeLabel(type)} needs at least ${minPoints} valid point${minPoints === 1 ? "" : "s"}.` };
    }

    let warning = "";
    if (rawPoints.length !== cleanPoints.length) {
      warning = `Entry ${index}: invalid or off-map points were removed.`;
    }

    if (rawFeature.category && !categoryById[rawFeature.category]) {
      warning = warning || `Entry ${index}: unknown category changed to Landmark.`;
    }

    const now = new Date().toISOString();

    return {
      feature: normalizeFeature({
        id: limitText(rawFeature.id || uniqueId(), SECURITY_LIMITS.maxIdChars) || uniqueId(),
        type,
        category: categoryById[rawFeature.category] ? rawFeature.category : "landmark",
        title: limitText(rawFeature.title || "Untitled", SECURITY_LIMITS.maxTitleChars) || "Untitled",
        confidence: rawFeature.confidence || "scouted",
        creator: limitText(rawFeature.creator || "Unknown", SECURITY_LIMITS.maxCreatorChars) || "Unknown",
        notes: limitText(rawFeature.notes || "", SECURITY_LIMITS.maxNotesChars),
        points: cleanPoints,
        source: "personal",
        createdAt: safeIso(rawFeature.createdAt) || now,
        updatedAt: safeIso(rawFeature.updatedAt) || safeIso(rawFeature.createdAt) || now
      }),
      warning
    };
  }

  function renderReceivePreview(result) {
    const counts = countFeatures(result.features);
    const creators = uniqueCreators(result.features);
    const duplicateCount = result.duplicates?.length || 0;

    const previewRows = result.features.slice(0, 8).map(feature => {
      const category = categoryById[feature.category] || categoryById.landmark;
      return `
        <li>
          <strong>${escapeHtml(feature.title || "Untitled")}</strong>
          <span>${escapeHtml(typeLabel(feature.type))} · ${escapeHtml(category.label)} · ${escapeHtml(feature.creator || "Unknown")}</span>
        </li>
      `;
    }).join("");

    const remaining = result.features.length > 8 ? `<p class="feature-meta">+ ${result.features.length - 8} more</p>` : "";
    const warnings = result.warnings?.length
      ? `<div class="receive-warning"><strong>Warnings</strong><ul>${result.warnings.slice(0, 6).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${result.warnings.length > 6 ? `<p class="feature-meta">+ ${result.warnings.length - 6} more warnings</p>` : ""}</div>`
      : "";
    const skipped = result.skipped?.length
      ? `<div class="receive-warning"><strong>Skipped</strong><ul>${result.skipped.slice(0, 6).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${result.skipped.length > 6 ? `<p class="feature-meta">+ ${result.skipped.length - 6} more skipped</p>` : ""}</div>`
      : "";
    const duplicates = duplicateCount
      ? `<p class="receive-duplicate-warning">${duplicateCount} possible duplicate${duplicateCount === 1 ? "" : "s"} found.</p>`
      : "";

    el.receivePreview.innerHTML = `
      <strong>${result.features.length} entr${result.features.length === 1 ? "y" : "ies"} ready</strong>
      <p class="feature-meta">${counts.marker} marks · ${counts.route} trails · ${counts.range} ranges</p>
      <p class="feature-meta">Creators: ${escapeHtml(creators.join(", "))}</p>
      <p class="feature-meta">Source: ${escapeHtml(result.app)}${result.exportedAt ? ` · ${escapeHtml(result.exportedAt)}` : ""}</p>
      ${duplicates}
      <ul>${previewRows}</ul>
      ${remaining}
      ${warnings}
      ${skipped}
    `;
  }

  // Receive apply and merge behavior.
  function applyReceivedFeatures(mode) {
    const incoming = (state.pendingReceive || []).map(normalizeFeature).filter(Boolean);
    const meta = state.pendingReceiveMeta || { duplicates: [] };
    const duplicateCount = meta.duplicates?.length || 0;

    if (!incoming.length) {
      alert("Review a valid code first.");
      return;
    }

    if (mode === "merge" && duplicateCount > 0) {
      const ok = confirm(`${duplicateCount} possible duplicate${duplicateCount === 1 ? "" : "s"} found. Merge anyway?`);
      if (!ok) return;
    }

    if (mode === "replace") {
      const typed = prompt("This will remove your current entries and replace them with the reviewed entries. Type REPLACE to continue.");
      if (typed !== "REPLACE") return;
    }

    pushUndo(mode === "replace" ? "receive replace" : "receive merge");

    if (mode === "replace") {
      state.features = incoming.map(cloneFeature);
    } else {
      state.features = mergeIncomingFeatures(state.features, incoming);
    }

    state.selectedId = null;
    state.drawPoints = [];
    state.draftFeature = null;
    state.pendingReceive = null;
    state.pendingReceiveMeta = null;

    saveState();
    renderAll();

    el.receiveDialog.close();
    el.receiveCodeInput.value = "";
    el.receivePreview.textContent = "";
    el.receiveMergeBtn.disabled = true;
    el.receiveReplaceBtn.disabled = true;

    setStatus(mode === "replace" ? "Received entries replaced yours." : "Received entries merged.");
  }

  function mergeIncomingFeatures(existingFeatures, incomingFeatures) {
    const usedIds = new Set(existingFeatures.map(feature => feature.id));
    const merged = existingFeatures.map(cloneFeature);

    incomingFeatures.forEach(feature => {
      const next = cloneFeature(feature);

      if (usedIds.has(next.id)) {
        next.id = uniqueId();
      }

      usedIds.add(next.id);
      merged.push(next);
    });

    return merged;
  }

  // Duplicate detection helpers.
  function findPotentialDuplicates(existingFeatures, incomingFeatures) {
    const existing = existingFeatures.map(normalizeFeature).filter(Boolean);
    const incoming = incomingFeatures.map(normalizeFeature).filter(Boolean);
    const duplicates = [];

    incoming.forEach(next => {
      const title = normalizedTitle(next.title);
      if (!title) return;

      const point = duplicatePoint(next);
      if (!point) return;

      const match = existing.find(current => {
        if (current.type !== next.type) return false;
        if (normalizedTitle(current.title) !== title) return false;

        const currentPoint = duplicatePoint(current);
        if (!currentPoint) return false;

        return pointDistance(point, currentPoint) <= SECURITY_LIMITS.duplicateDistancePixels;
      });

      if (match) duplicates.push({ incoming: next, existing: match });
    });

    return duplicates;
  }

  function duplicatePoint(feature) {
    if (!feature?.points?.length) return null;

    if (feature.type === "marker") return feature.points[0];

    const total = feature.points.reduce((sum, point) => ({
      x: sum.x + Number(point.x || 0),
      y: sum.y + Number(point.y || 0)
    }), { x: 0, y: 0 });

    return {
      x: total.x / feature.points.length,
      y: total.y / feature.points.length
    };
  }

  function pointDistance(a, b) {
    const dx = Number(a.x) - Number(b.x);
    const dy = Number(a.y) - Number(b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function normalizedTitle(title) {
    return String(title || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function countFeatures(features) {
    return features.reduce((counts, feature) => {
      counts[feature.type] = (counts[feature.type] || 0) + 1;
      return counts;
    }, { marker: 0, route: 0, range: 0 });
  }

  function uniqueCreators(features) {
    const names = [...new Set(features.map(feature => feature.creator || "Unknown"))].slice(0, 8);
    if (!names.length) return ["Unknown"];
    return names;
  }

  function typeLabel(type) {
    return type === "route" ? "Trail" : type === "range" ? "Range" : "Mark";
  }

  function cleanAtlas() {
    if (!confirm("Remove all custom entries? The map will stay.")) return;

    pushUndo("clean atlas");
    state.features = [];
    state.selectedId = null;
    state.drawPoints = [];
    state.draftFeature = null;

    saveState();
    renderAll();
    setStatus("Atlas cleaned");
  }

  function exportFullMapImage() {
    setStatus("Preparing image export...");

    const canvas = document.createElement("canvas");
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Could not create the image canvas.");
      setStatus("Image export failed.");
      return;
    }

    const image = new Image();

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => {
      try {
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        ctx.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        state.features.forEach(feature => drawFeatureOnCanvas(ctx, feature));
        state.features.forEach(feature => drawFeatureLabelOnCanvas(ctx, feature));
        drawExportFooter(ctx, MAP_WIDTH, MAP_HEIGHT);

        if (canvas.toBlob) {
          canvas.toBlob(blob => {
            if (!blob) {
              alert("Could not create the PNG file. Try using the live GitHub Pages site instead of opening the file directly.");
              setStatus("Image export failed.");
              return;
            }

            downloadBlob(blob, "wanderers-atlas-map.png");
            setStatus("Image exported.");
          }, "image/png");

          return;
        }

        const dataUrl = canvas.toDataURL("image/png");
        downloadHref(dataUrl, "wanderers-atlas-map.png");
        setStatus("Image exported.");
      } catch (error) {
        console.error("Image export failed", error);
        alert("Save Image failed. If you are testing by opening index.html directly, try testing from GitHub Pages or Live Server.");
        setStatus("Image export failed.");
      }
    };

    image.onerror = () => {
      alert("Could not load the map image for export.");
      setStatus("Image export failed.");
    };

    image.src = MAP_IMAGE;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    downloadHref(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function downloadHref(href, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function drawExportFooter(ctx, width, height) {
    const scale = Math.max(1, width / 1600);
    const inset = 7 * scale;
    const x = 14 * scale;
    const y = height - 14 * scale;

    ctx.save();
    ctx.strokeStyle = "rgba(238, 238, 238, 0.48)";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

    ctx.fillStyle = "rgba(245, 245, 245, 0.86)";
    ctx.font = `${12 * scale}px Georgia, "Times New Roman", serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Wanderer’s Atlas — Field Notes", x, y);
    ctx.restore();
  }

  function drawFeatureOnCanvas(ctx, feature) {
    const category = categoryById[feature.category] || categoryById.landmark;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (feature.type === "marker") {
      const point = feature.points[0];
      drawCanvasSigilMarker(ctx, feature.category, point, category.color);
    }

    if (feature.type === "route") {
      ctx.strokeStyle = category.color;
      ctx.lineWidth = 12;
      ctx.beginPath();
      feature.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    if (feature.type === "range") {
      ctx.fillStyle = hexToRgba(category.color, .18);
      ctx.strokeStyle = category.color;
      ctx.lineWidth = 10;
      ctx.beginPath();
      feature.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFeatureLabelOnCanvas(ctx, feature) {
    const text = String(feature.title || "Untitled").trim();
    if (!text || !Array.isArray(feature.points) || !feature.points.length) return;

    const point = labelPointForFeature(feature);
    if (!point) return;

    const category = categoryById[feature.category] || categoryById.landmark;
    const fontSize = 46;
    const paddingX = 18;
    const paddingY = 10;
    const lineHeight = fontSize + 6;
    const maxWidth = 520;
    const lines = wrapCanvasText(ctx, text, maxWidth);

    ctx.save();
    ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.textBaseline = "top";

    const measuredWidth = Math.min(
      maxWidth,
      Math.max(...lines.map(line => ctx.measureText(line).width), 1)
    );

    const boxWidth = measuredWidth + paddingX * 2;
    const boxHeight = lines.length * lineHeight + paddingY * 2;

    let x = point.x + 34;
    let y = point.y - boxHeight / 2;

    if (feature.type === "route" || feature.type === "range") {
      x = point.x + 28;
      y = point.y - boxHeight - 22;
    }

    x = Math.max(8, Math.min(MAP_WIDTH - boxWidth - 8, x));
    y = Math.max(8, Math.min(MAP_HEIGHT - boxHeight - 8, y));

    ctx.fillStyle = "rgba(255, 248, 224, 0.90)";
    ctx.strokeStyle = category.color || "#6b5230";
    ctx.lineWidth = 5;
    roundedRect(ctx, x, y, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2c1d0e";
    lines.forEach((line, index) => {
      ctx.fillText(line, x + paddingX, y + paddingY + index * lineHeight);
    });

    ctx.restore();
  }

  function labelPointForFeature(feature) {
    if (feature.type === "marker") return feature.points[0];

    if (feature.type === "route" || feature.type === "range") {
      return midpointImage(feature.points);
    }

    return feature.points[0] || null;
  }

  function midpointImage(points) {
    if (!points.length) return null;
    if (points.length === 1) return points[0];

    let bestIndex = Math.floor(points.length / 2);
    let total = 0;
    const distances = [];

    for (let index = 1; index < points.length; index++) {
      const distance = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
      distances.push(distance);
      total += distance;
    }

    if (total <= 0) return points[bestIndex];

    let walked = 0;
    const half = total / 2;

    for (let index = 1; index < points.length; index++) {
      const distance = distances[index - 1];

      if (walked + distance >= half) {
        const ratio = distance ? (half - walked) / distance : 0;
        return {
          x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
          y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio
        };
      }

      walked += distance;
    }

    return points[bestIndex];
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    ctx.save();
    ctx.font = `700 46px Georgia, "Times New Roman", serif`;

    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      ctx.restore();
      return ["Untitled"];
    }

    const lines = [];
    let line = "";

    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;

      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    });

    if (line) lines.push(line);

    ctx.restore();
    return lines.slice(0, 3);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function loadState() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      state.creatorName = settings.creatorName || "";
      state.panelCollapsed = !!settings.panelCollapsed;
      state.toolPanelCollapsed = !!settings.toolPanelCollapsed;
      el.creatorInput.value = state.creatorName;

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (Array.isArray(saved.features)) {
        state.features = saved.features.map(normalizeFeature).filter(Boolean);
      }
    } catch (error) {
      console.warn("Could not load state", error);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      map: { image: MAP_IMAGE, width: MAP_WIDTH, height: MAP_HEIGHT },
      savedAt: new Date().toISOString(),
      features: state.features
    }));

    saveSettings();
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      creatorName: state.creatorName,
      panelCollapsed: state.panelCollapsed,
      toolPanelCollapsed: state.toolPanelCollapsed
    }));
  }

  function updatePanelState() {
    el.ledgerPanel.classList.toggle("is-collapsed", state.panelCollapsed);
    el.ledgerToggle.textContent = state.panelCollapsed ? "‹" : "›";
    el.ledgerToggle.title = state.panelCollapsed ? "Open atlas panel" : "Collapse atlas panel";

    el.toolPanel.classList.toggle("is-collapsed", state.toolPanelCollapsed);
    el.toolToggle.textContent = state.toolPanelCollapsed ? "›" : "‹";
    el.toolToggle.title = state.toolPanelCollapsed ? "Open tools panel" : "Collapse tools panel";
  }

  function normalizeFeature(feature) {
    if (!feature || !Array.isArray(feature.points)) return null;

    const cleanPoints = feature.points
      .slice(0, SECURITY_LIMITS.maxPointsPerFeature)
      .map(point => ({ x: Number(point.x), y: Number(point.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      .filter(imagePointIsInside);

    if (!cleanPoints.length) return null;

    const type = ["marker", "route", "range"].includes(feature.type) ? feature.type : "marker";

    return {
      id: limitText(feature.id || uniqueId(), SECURITY_LIMITS.maxIdChars) || uniqueId(),
      type,
      category: categoryById[feature.category] ? feature.category : "landmark",
      title: limitText(feature.title || "Untitled", SECURITY_LIMITS.maxTitleChars) || "Untitled",
      confidence: feature.confidence || "scouted",
      creator: limitText(feature.creator || "Unknown", SECURITY_LIMITS.maxCreatorChars) || "Unknown",
      notes: limitText(feature.notes || "", SECURITY_LIMITS.maxNotesChars),
      points: cleanPoints,
      source: feature.source || "personal",
      createdAt: safeIso(feature.createdAt) || new Date().toISOString(),
      updatedAt: safeIso(feature.updatedAt) || safeIso(feature.createdAt) || new Date().toISOString()
    };
  }

  function cloneFeature(feature) {
    return {
      ...feature,
      points: feature.points.map(point => ({ ...point }))
    };
  }

  function currentCreator() {
    return normalizeName(el.creatorInput.value) || "Unknown";
  }

  function normalizeName(name) {
    return limitText(String(name || "").trim(), SECURITY_LIMITS.maxCreatorChars);
  }

  function limitText(value, maxLength) {
    const text = String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
    return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
  }

  function safeIso(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function formatBytes(bytes) {
    if (bytes >= 1000000) return `${Math.round(bytes / 1000000)} MB`;
    if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
    return `${bytes} bytes`;
  }

  function uniqueId() {
    return crypto.randomUUID ? crypto.randomUUID() : `feature-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function tooltipHtml(feature) {
    return `
      <span class="dom-tooltip">
        <span class="tooltip-title">${escapeHtml(feature.title || "Untitled")}</span><br>
        <span class="tooltip-by">Mapped by ${escapeHtml(feature.creator || "Unknown")}</span><br>
        <span class="tooltip-time">${escapeHtml(relativeTime(feature.updatedAt))}</span>
      </span>
    `;
  }

  function pointsToString(points) {
    return points.map(point => `${point.x},${point.y}`).join(" ");
  }

  function previewText(text) {
    text = String(text || "").trim();
    if (!text) return "No notes added.";
    return text.length > 95 ? `${text.slice(0, 92).trim()}...` : text;
  }

  function relativeTime(iso) {
    if (!iso) return "Updated recently";

    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return "Updated recently";

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
    const diff = Math.round((startToday - startThen) / 86400000);

    if (diff <= 0) return "Updated today";
    if (diff === 1) return "Updated yesterday";
    return `Updated ${diff} days ago`;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function setupBuildBadge() {
    if (document.querySelector(".build-badge")) return;

    const badge = document.createElement("div");
    badge.className = "build-badge";
    badge.textContent = BUILD_LABEL;
    document.body.appendChild(badge);
  }

  function setStatus(message) {
    const text = message || "Wanderer’s Atlas";

    el.statusBar.textContent = text;

    const footer = document.querySelector(".build-badge");
    if (footer) footer.textContent = text;
  }
})();