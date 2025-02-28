import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const Navbar = () => {
    const { login, logout, ready, authenticated } = usePrivy();
    return (
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
    );
};

export default Navbar;