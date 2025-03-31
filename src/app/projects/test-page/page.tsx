'use client';

export default function TestPage() {
  console.log('STATIC TEST PAGE LOADED');

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
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Static Test Page</h1>
      <p>This is a completely static test page with no parameters or data fetching</p>
    </div>
  );
} 