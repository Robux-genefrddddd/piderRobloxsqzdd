import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { WarningNotificationModal } from "@/components/WarningNotificationModal";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import AssetDetail from "./pages/AssetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Upload from "./pages/Upload";
import Collections from "./pages/Collections";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Legal from "./pages/Legal";
import AdminPanel from "./pages/AdminPanel";
import Support from "./pages/Support";
import SupportNewTicket from "./pages/SupportNewTicket";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import NotFound from "./pages/NotFound";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Messages from "./pages/Messages";
import BanNotice from "./pages/BanNotice";
import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserActiveWarnings } from "@/lib/warningService";

const queryClient = new QueryClient();

// Guard component to check if user is banned
const BanGuard = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!loading && user) {
        const warnings = await getUserActiveWarnings(user.uid);
        const hasBan = warnings.some((w) => w.type === "ban" || w.type === "suspension");
        if (hasBan) {
          navigate("/banned");
        }
      }
    };

    checkBanStatus();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Routes component to avoid wrapping every single route
const ProtectedRoutes = () => (
  <BanGuard>
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Index />
          </Layout>
        }
      />
      <Route
        path="/marketplace"
        element={
          <Layout>
            <Marketplace />
          </Layout>
        }
      />
      <Route
        path="/asset/:id"
        element={
          <Layout>
            <AssetDetail />
          </Layout>
        }
      />
      <Route
        path="/login"
        element={
          <Layout>
            <Login />
          </Layout>
        }
      />
      <Route
        path="/register"
        element={
          <Layout>
            <Register />
          </Layout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/about"
        element={
          <Layout>
            <About />
          </Layout>
        }
      />
      <Route
        path="/upload"
        element={
          <Layout>
            <Upload />
          </Layout>
        }
      />
      <Route
        path="/collections"
        element={
          <Layout>
            <Collections />
          </Layout>
        }
      />
      <Route
        path="/blog"
        element={
          <Layout>
            <Blog />
          </Layout>
        }
      />
      <Route
        path="/contact"
        element={
          <Layout>
            <Contact />
          </Layout>
        }
      />
      <Route
        path="/privacy"
        element={
          <Layout>
            <Privacy />
          </Layout>
        }
      />
      <Route
        path="/terms"
        element={
          <Layout>
            <Terms />
          </Layout>
        }
      />
      <Route
        path="/cookies"
        element={
          <Layout>
            <Cookies />
          </Layout>
        }
      />
      <Route
        path="/legal"
        element={
          <Layout>
            <Legal />
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <AdminPanel />
          </Layout>
        }
      />
      <Route
        path="/support"
        element={
          <Layout>
            <Support />
          </Layout>
        }
      />
      <Route
        path="/support/new"
        element={
          <Layout>
            <SupportNewTicket />
          </Layout>
        }
      />
      <Route
        path="/support/ticket/:ticketId"
        element={
          <Layout>
            <SupportTicketDetail />
          </Layout>
        }
      />
      <Route
        path="/groups"
        element={
          <Layout>
            <Groups />
          </Layout>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <Layout>
            <GroupDetail />
          </Layout>
        }
      />
      <Route
        path="/messages"
        element={
          <Layout>
            <Messages />
          </Layout>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route
        path="*"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
    </Routes>
  </BanGuard>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <WarningNotificationModal />
        <BrowserRouter>
          <Routes>
            {/* Ban Notice - no layout, fullscreen */}
            <Route path="/banned" element={<BanNotice />} />

            {/* Protected routes with ban guard */}
            <Route
              path="/"
              element={
                <BanGuard>
                  <Layout>
                    <Index />
                  </Layout>
                </BanGuard>
              }
            />
            <Route
              path="/marketplace"
              element={
                <Layout>
                  <Marketplace />
                </Layout>
              }
            />
            <Route
              path="/asset/:id"
              element={
                <Layout>
                  <AssetDetail />
                </Layout>
              }
            />
            <Route
              path="/login"
              element={
                <Layout>
                  <Login />
                </Layout>
              }
            />
            <Route
              path="/register"
              element={
                <Layout>
                  <Register />
                </Layout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <About />
                </Layout>
              }
            />
            <Route
              path="/upload"
              element={
                <Layout>
                  <Upload />
                </Layout>
              }
            />
            <Route
              path="/collections"
              element={
                <Layout>
                  <Collections />
                </Layout>
              }
            />
            <Route
              path="/blog"
              element={
                <Layout>
                  <Blog />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />
            <Route
              path="/privacy"
              element={
                <Layout>
                  <Privacy />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout>
                  <Terms />
                </Layout>
              }
            />
            <Route
              path="/cookies"
              element={
                <Layout>
                  <Cookies />
                </Layout>
              }
            />
            <Route
              path="/legal"
              element={
                <Layout>
                  <Legal />
                </Layout>
              }
            />
            <Route
              path="/admin"
              element={
                <Layout>
                  <AdminPanel />
                </Layout>
              }
            />
            <Route
              path="/support"
              element={
                <Layout>
                  <Support />
                </Layout>
              }
            />
            <Route
              path="/support/new"
              element={
                <Layout>
                  <SupportNewTicket />
                </Layout>
              }
            />
            <Route
              path="/support/ticket/:ticketId"
              element={
                <Layout>
                  <SupportTicketDetail />
                </Layout>
              }
            />
            <Route
              path="/groups"
              element={
                <Layout>
                  <Groups />
                </Layout>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <Layout>
                  <GroupDetail />
                </Layout>
              }
            />
            <Route
              path="/messages"
              element={
                <Layout>
                  <Messages />
                </Layout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
