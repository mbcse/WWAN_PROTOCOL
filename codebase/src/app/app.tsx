import Navbar from '@/components/custom/Navbar';
// import NxWelcome from './nx-welcome';
import Homepage from '@/pages/Home';
import { Toaster } from "@/components/ui/sonner"
// import ChatPage from '@/components/custom/ChatPage';


export function App() {
  
  return (
    <div>
      <Navbar />
      {/* <NxWelcome title="codebase" /> */}
      <Homepage />
      {/* <ChatPage /> */}
      <Toaster />
    </div>
  );
}

export default App;
