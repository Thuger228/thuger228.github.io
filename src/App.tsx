import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LANGUAGES, PageSlug, pagePath } from "@/i18n/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Recording from "./pages/Recording";
import Rehearsals from "./pages/Rehearsals";
import Rent from "./pages/Rent";
import Price from "./pages/Price";
import Contact from "./pages/Contact";
import Voucher from "./pages/Voucher";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageComponents: Record<PageSlug, () => JSX.Element> = {
  "": Index,
  recording: Recording,
  rehearsals: Rehearsals,
  rent: Rent,
  price: Price,
  contact: Contact,
  voucher: Voucher,
  booking: Booking,
};

// Shared between the browser (BrowserRouter) and the build-time pre-renderer (StaticRouter).
export const AppShell = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <ScrollToTop />
        <Header />
        <Routes>
          {LANGUAGES.flatMap((lang) =>
            (Object.keys(pageComponents) as PageSlug[]).map((slug) => {
              const Page = pageComponents[slug];
              return <Route key={`${lang}-${slug}`} path={pagePath(lang, slug)} element={<Page />} />;
            })
          )}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
