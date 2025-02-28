import Navbar from '@/components/custom/Navbar';
// import NxWelcome from './nx-welcome';
import Homepage from '@/pages/Home';

export function App() {
  
  return (
    <div>
      <Navbar />
      {/* <NxWelcome title="codebase" /> */}
      <Homepage />
    </div>
  );
}

export default App;
