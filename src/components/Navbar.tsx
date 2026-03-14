import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between px-4 py-4 max-w-4xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary animate-pulse-glow">
                        <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground text-glow">QRShield AI</h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">Intelligent QR Security Scanner</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
