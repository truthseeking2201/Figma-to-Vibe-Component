figma.showUI(__html__, { width: 400, height: 300 });

function extractProperties(node: SceneNode) {
  const props: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
    visible: node.visible,
  };

  if ('fills' in node && node.fills !== figma.mixed) {
    props.fills = node.fills;
  }

  if ('strokes' in node && node.strokes !== figma.mixed) {
    props.strokes = node.strokes;
    props.strokeWeight = (node as GeometryMixin & SceneNode).strokeWeight;
  }

  if ('cornerRadius' in node) {
    const cornerNode = node as GeometryMixin & CornerMixin;
    if (typeof cornerNode.cornerRadius === 'number') {
      props.cornerRadius = cornerNode.cornerRadius;
    } else {
      props.cornerRadius = {
        topLeft: cornerNode.topLeftRadius,
        topRight: cornerNode.topRightRadius,
        bottomLeft: cornerNode.bottomLeftRadius,
        bottomRight: cornerNode.bottomRightRadius,
      };
    }
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
