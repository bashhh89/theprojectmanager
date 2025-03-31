export default function TestRootPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1F2937', 
      color: 'white',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Root Test Page</h1>
      <p>This is a test page at the root level</p>
    </div>
  );
} 