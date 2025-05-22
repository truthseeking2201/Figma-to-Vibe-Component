figma.showUI(__html__, { width: 400, height: 300 });

function extractProperties(node: SceneNode) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };
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
