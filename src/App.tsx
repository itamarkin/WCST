import './App.css'; // You can keep this or remove it if unused
import WCST from './components/WCST';

function App() {
  const handleWCSTComplete = (data: any) => {
    console.log('WCST Test Completed:', data);
  };

  // Render the WCST component directly.
  // It handles its own full-screen layout.
  return (
    <WCST onComplete={handleWCSTComplete} />
  );
}

export default App;