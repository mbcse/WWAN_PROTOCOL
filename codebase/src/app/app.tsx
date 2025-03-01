import Navbar from '@/components/custom/Navbar';
// import NxWelcome from './nx-welcome';
import Homepage from '@/pages/Home';
import { Toaster } from "@/components/ui/sonner"
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';


export function App() {
    const { login, authenticated } = usePrivy();

    useEffect(() => {
      if (!authenticated) {
        login();
      }
    }, [authenticated]);
  
  return (
    <div>
      <Navbar />
      {/* <NxWelcome title="codebase" /> */}
      <Homepage />
      <Toaster />
    </div>
  );
}

export default App;
