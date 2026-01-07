import { Heart } from "lucide-react";

const PlatformFooter = () => {
    return (
        <footer className="py-6 mt-auto border-t border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-4 md:gap-0">
                <div className="flex items-center gap-1">
                    <span>© {new Date().getFullYear()} KAI Academic System</span>
                </div>

                <div className="flex items-center justify-center gap-1 opacity-80 flex-wrap text-center">
                    <span>Hecho con</span>
                    <Heart size={14} className="text-pastel-pink fill-pastel-pink mx-1" />
                    <span>para estudiantes de ingeniería</span>
                </div>
            </div>
        </footer>
    );
};

export default PlatformFooter;
