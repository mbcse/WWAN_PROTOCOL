/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
// Add these imports
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import AgentRegistrationForm from './AgenticRegistrationForm';

const Navbar = () => {
    const { login, logout, ready, authenticated } = usePrivy();
    const [open, setOpen] = React.useState(false);

    const registerAgent = () => {
        setOpen(true);
    };

    const handleAgentRegistration = (values: any) => {
        console.log('Form submitted:', values);
        // The skillList will already be an array at this point
        // values.skillList will be: ["skill1", "skill2", "skill3"]
        setOpen(false);
    };


    return (
        <>
            <nav className="bg-slate-900 text-white py-4 px-6 shadow-md">
                <div className="container-fluid mx-auto flex justify-between items-center">
                    {/* Logo */}
                    <div className="text-xl font-bold">
                        <a href="/" className="flex items-center gap-2">
                            <span className="text-blue-400">WWAN</span>
                            <span>Protocol</span>
                        </a>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="/" className="hover:text-blue-400 transition-colors">Home</a>
                        <a href="/explore" className="hover:text-blue-400 transition-colors">Explore</a>
                        <a href="/markets" className="hover:text-blue-400 transition-colors">Markets</a>
                        <a href="/portfolio" className="hover:text-blue-400 transition-colors">Portfolio</a>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={registerAgent}>Register an Agent</Button>

                    {/* Connect Wallet Button */}
                    {authenticated && <Button className="bg-blue-600 hover:bg-blue-700" onClick={login}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                    </Button>}
                    {!authenticated && <Button className="bg-blue-600 hover:bg-blue-700" onClick={logout}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Disconnect
                    </Button>}
                </div>
            </nav>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register Agent</DialogTitle>
                    </DialogHeader>
                    {/* Add your registration form or content here */}
                    <AgentRegistrationForm 
                        onSubmit={handleAgentRegistration}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Navbar;