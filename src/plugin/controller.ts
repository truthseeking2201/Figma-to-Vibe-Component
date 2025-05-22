figma.showUI(__html__, { width: 400, height: 300 });

function extractProperties(node: SceneNode) {
  const props: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
  };

  // Only add geometric properties for nodes that have them
  if ('x' in node) props.x = node.x;
  if ('y' in node) props.y = node.y;
  if ('width' in node) props.width = node.width;
  if ('height' in node) props.height = node.height;
  if ('rotation' in node) props.rotation = node.rotation;
  if ('opacity' in node) props.opacity = node.opacity;

  if ('fills' in node && node.fills !== figma.mixed) {
    props.fills = node.fills;
  }

  if ('strokes' in node && Array.isArray(node.strokes)) {
    props.strokes = node.strokes;
    props.strokeWeight = (node as GeometryMixin & SceneNode).strokeWeight;
  }

  if ('cornerRadius' in node) {
    const cornerNode = node as CornerMixin;
    props.cornerRadius = cornerNode.cornerRadius;
    
    // Individual corner radius properties (if they exist)
    if ('topLeftRadius' in cornerNode) props.topLeftRadius = cornerNode.topLeftRadius;
    if ('topRightRadius' in cornerNode) props.topRightRadius = cornerNode.topRightRadius;
    if ('bottomLeftRadius' in cornerNode) props.bottomLeftRadius = cornerNode.bottomLeftRadius;
    if ('bottomRightRadius' in cornerNode) props.bottomRightRadius = cornerNode.bottomRightRadius;
  }

  if ('effects' in node) {
    props.effects = node.effects;
  }

  if ('constraints' in node) {
    props.constraints = node.constraints;
  }

  if ('layoutMode' in node) {
    const layoutNode = node as FrameNode;
    props.layoutMode = layoutNode.layoutMode;
    props.primaryAxisSizingMode = layoutNode.primaryAxisSizingMode;
    props.counterAxisSizingMode = layoutNode.counterAxisSizingMode;
    props.itemSpacing = layoutNode.itemSpacing;
    props.paddingLeft = layoutNode.paddingLeft;
    props.paddingRight = layoutNode.paddingRight;
    props.paddingTop = layoutNode.paddingTop;
    props.paddingBottom = layoutNode.paddingBottom;
  }

  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    props.characters = textNode.characters;
    props.fontName = textNode.fontName;
    props.fontSize = textNode.fontSize;
    props.textAlignHorizontal = textNode.textAlignHorizontal;
    props.textAlignVertical = textNode.textAlignVertical;
    props.lineHeight = textNode.lineHeight;
    props.letterSpacing = textNode.letterSpacing;
  }

  return props;
}

function collectNodeProperties(node: SceneNode): any {
  const props = extractProperties(node);
  if ('children' in node) {
    props.children = node.children.map(collectNodeProperties);
  }
  return props;
}

function sendSelectionProperties() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const node = selection[0];
    const data = collectNodeProperties(node);
    figma.ui.postMessage({ type: 'selection-properties', data });
  } else {
    figma.ui.postMessage({ type: 'selection-properties', data: null });
  }
}

sendSelectionProperties();

figma.on('selectionchange', sendSelectionProperties);
