import * as React from 'react';

interface NodeProperty {
  key: string;
  value: any;
  type: string;
}

const styles = {
  container: {
    padding: '16px',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#fafafa',
    overflow: 'auto',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center' as const,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    maxWidth: '280px',
    width: '100%',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#f3f4f6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  emptyDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  layerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  layerType: {
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    display: 'inline-block',
  },
  copyButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  copyButtonCopied: {
    backgroundColor: '#10b981',
  },
  copyButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  propertiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  propertyItem: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
  },
  propertyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  propertyKey: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
  },
  propertyType: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '6px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  propertyValue: {
    fontSize: '12px',
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
    color: '#111827',
    wordBreak: 'break-all' as const,
    lineHeight: '1.4',
  },
  jsonContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    overflow: 'auto',
    maxHeight: '300px',
  },
  jsonPre: {
    fontSize: '11px',
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
    color: '#334155',
    margin: '0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
  },
  scrollbar: {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: '#cbd5e1 transparent',
  },
};

const App: React.FC = () => {
  const [properties, setProperties] = React.useState<string>('');
  const [parsedData, setParsedData] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<string>('');

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const { pluginMessage } = event.data;
        if (pluginMessage && pluginMessage.type === 'selection-properties') {
          if (pluginMessage.data) {
            const formatted = JSON.stringify(pluginMessage.data, null, 2);
            setProperties(formatted);
            setParsedData(pluginMessage.data);
            setSelectedNode(pluginMessage.data.name || 'Unnamed Layer');
          } else {
            setProperties('');
            setParsedData(null);
            setSelectedNode('');
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      if (properties) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(properties);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = properties;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPropertyType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  };

  const getTypeStyle = (type: string) => {
    const baseStyle = { ...styles.propertyType };
    switch (type) {
      case 'string':
        return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
      case 'number':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1d4ed8' };
      case 'boolean':
        return { ...baseStyle, backgroundColor: '#f3e8ff', color: '#7c3aed' };
      case 'object':
        return { ...baseStyle, backgroundColor: '#fed7aa', color: '#c2410c' };
      case 'array':
        return { ...baseStyle, backgroundColor: '#fce7f3', color: '#be185d' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const renderPropertyValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getKeyProperties = (data: any): NodeProperty[] => {
    if (!data) return [];
    
    const keyProps = ['name', 'type', 'width', 'height', 'x', 'y', 'rotation', 'opacity'];
    return keyProps
      .filter(key => data.hasOwnProperty(key))
      .map(key => ({
        key,
        value: data[key],
        type: getPropertyType(data[key])
      }));
  };

  if (!parsedData) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No Layer Selected</h3>
            <p style={styles.emptyDescription}>
              Select a layer in Figma to view its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const keyProperties = getKeyProperties(parsedData);
  const buttonStyle = {
    ...styles.copyButton,
    ...(copied ? styles.copyButtonCopied : {}),
    ...(!properties ? styles.copyButtonDisabled : {}),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div style={styles.headerText}>
              <h3 style={styles.layerName}>{selectedNode}</h3>
              <span style={styles.layerType}>{parsedData.type}</span>
            </div>
          </div>
          <button 
            onClick={copyToClipboard} 
            disabled={!properties}
            style={buttonStyle}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Properties */}
      {keyProperties.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Key Properties
          </h4>
          <div style={styles.propertiesGrid}>
            {keyProperties.map(({ key, value, type }) => (
              <div key={key} style={styles.propertyItem}>
                <div style={styles.propertyHeader}>
                  <span style={styles.propertyKey}>{key}</span>
                  <span style={getTypeStyle(type)}>{type}</span>
                </div>
                <div style={styles.propertyValue} title={renderPropertyValue(value)}>
                  {renderPropertyValue(value).length > 20 
                    ? renderPropertyValue(value).substring(0, 20) + '...'
                    : renderPropertyValue(value)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full JSON */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Complete JSON Properties</h4>
        <div style={{ ...styles.jsonContainer, ...styles.scrollbar }}>
          <pre style={styles.jsonPre}>{properties}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;