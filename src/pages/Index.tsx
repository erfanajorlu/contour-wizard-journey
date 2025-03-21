
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ImageGallery from "@/components/ImageGallery";
import ImageProcessor from "@/components/ImageProcessor";
import Tutorial from "@/components/Tutorial";

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Contour Detection Visualization
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Explore how computers identify and trace object boundaries in images
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <a href="#processor">Try It Now</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <Tutorial />
        <ImageGallery />
        <ImageProcessor />
      </main>
      <Footer />
    </div>
  );
}
