import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";

export default function PrescriptionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden">
            <Header />
            <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background overflow-x-hidden">
                {children}
            </main>
            <Footer />
        </div>
    );
}
