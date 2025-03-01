/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
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
    const { login, logout, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [address, setAddress] = useState<string | null>(null);

    const [open, setOpen] = React.useState(false);

    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const registerAgent = () => {
        setOpen(true);
    };

    const handleAgentRegistration = (values: any) => {
        console.log('Form submitted:', values);
        // The skillList will already be an array at this point
        // values.skillList will be: ["skill1", "skill2", "skill3"]
        setOpen(false);
    };

    useEffect(() => {
        if (wallets.length > 0) {
            const wallet = wallets[0];
            setAddress(wallet.address);
        }
    }, [wallets]);


    return (
        <>
            <nav className="bg-[#121212] text-white py-4 px-6 shadow-md">
                <div className="container-fluid mx-auto flex justify-between items-center">
                    {/* Logo */}
                    <div className="text-xl font-bold">
                        <a href="/" className="flex items-center gap-2">
                            <img src="/wwan_logo.png" alt="Logo" className="h-8 w-8" />
                            <span className="text-blue-400">WWAN</span>
                            <span>Protocol</span>
                        </a>
                    </div>

                    {/* Navigation Links */}
                    {/* <div className="hidden md:flex items-center space-x-8">
                        <a href="/" className="hover:text-blue-400 transition-colors">Home</a>
                        <a href="/explore" className="hover:text-blue-400 transition-colors">Explore</a>
                        <a href="/markets" className="hover:text-blue-400 transition-colors">Markets</a>
                        <a href="/portfolio" className="hover:text-blue-400 transition-colors">Portfolio</a>
                    </div> */}

                    <div className='flex items-center space-x-4'>
                        <Button className="bg-[#4A89DC] text-white hover:bg-blue-700" onClick={registerAgent}>Register an Agent</Button>

                        {/* Connect Wallet Button */}
                        {!authenticated && <Button className="bg-blue-600 hover:bg-blue-700" onClick={login}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet
                        </Button>}
                        {authenticated && <Button className="bg-blue-600 hover:bg-blue-700 py-5" onClick={logout}>
                            <Wallet className="mr-2 h-4 w-4" />
                            <div className='flex flex-col items-start text-sm'>
                                <span className="font-medium">{truncateAddress(address || '')}</span>
                                <span className="text-gray-300 text-xs">Disconnect</span>
                            </div>
                        </Button>}
                    </div>
                </div>
            </nav>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register AI Agent</DialogTitle>
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