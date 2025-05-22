import * as React from 'react';

const App: React.FC = () => {
  const [properties, setProperties] = React.useState<string>('');

  React.useEffect(() => {
    window.onmessage = (event) => {
      const { pluginMessage } = event.data;
      if (pluginMessage && pluginMessage.type === 'selection-properties') {
        if (pluginMessage.data) {
          setProperties(JSON.stringify(pluginMessage.data, null, 2));
        } else {
          setProperties('');
        }
      }
    };
  }, []);

  const copyToClipboard = () => {
    if (properties) navigator.clipboard.writeText(properties);
  };

  return (
    <div style={{ padding: '16px' }}>
      <pre>{properties || 'Select a layer to preview properties'}</pre>
      <button onClick={copyToClipboard} disabled={!properties}>
        Copy to Clipboard
      </button>
    </div>
  );
};

export default App;
