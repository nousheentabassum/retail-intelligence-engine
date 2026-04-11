import "./globals.css";
import { AuthProvider } from "../hooks/useAuth";

export const metadata = {
  title: "Retail Intelligence Engine",
  description: "AI-driven retail forecasting and optimization"
};

function Navigation({ user }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur p-5 flex flex-col">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-emerald-400 mb-1">
          Retail Intelligence
        </div>
        <h1 className="text-lg font-semibold">Control Center</h1>
      </div>
      <nav className="space-y-2 text-sm flex-1">
        <a href="/dashboard" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Dashboard
        </a>
        <a href="/inventory" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Inventory
        </a>
        <a href="/forecasting" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Forecasting
        </a>
        <a href="/optimization" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Optimization
        </a>
        <a href="/analytics" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Analytics
        </a>
        <a href="/recommendations" className="block px-2 py-1.5 rounded hover:bg-slate-900">
          Recommendations
        </a>
      </nav>
      
      {user && (
        <div className="border-t border-slate-800 pt-4 mt-4">
          <div className="text-xs text-slate-400 mb-2">
            Logged in as:
          </div>
          <div className="text-sm text-slate-200 mb-3">
            {user.firstName} {user.lastName}
          </div>
          <a 
            href="/login" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/login';
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Sign out
          </a>
        </div>
      )}
      
      <div className="mt-6 text-[11px] text-slate-500">
        AI + time-series + optimization
      </div>
    </aside>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 p-6 bg-slate-950">
              <div className="max-w-6xl mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

