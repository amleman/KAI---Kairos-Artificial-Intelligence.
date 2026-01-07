import { Outlet } from "react-router-dom";
import GlassLayout from "./GlassLayout";
import Navbar from "../Navbar";
import PlatformFooter from "../PlatformFooter";

const PlatformLayout = () => {
    return (
        <GlassLayout>
            <Navbar />
            <div className="flex flex-col min-h-screen lg:ml-72 transition-all duration-300">
                <main className="flex-grow pt-20 lg:pt-8 px-4 sm:px-6">
                    <Outlet />
                </main>
                <PlatformFooter />
            </div>
        </GlassLayout>
    );
};

export default PlatformLayout;
