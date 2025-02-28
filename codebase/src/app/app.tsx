import { Button } from '@/components/ui/button';
import { usePrivy } from '@privy-io/react-auth';

export function App() {
  const { login, logout } = usePrivy();
  
  return (
    <div>
      {/* <NxWelcome title="codebase" /> */}
      <Button onClick={login}>Login</Button>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}

export default App;
