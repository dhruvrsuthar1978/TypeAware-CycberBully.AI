import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Context providers
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

// UI components
import Navigation from "@/components/Navigation"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

// Pages
import Home from "./pages/Home"
import About from "./pages/About"
import ToxicityDemo from "./pages/ToxicityDemo"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import UserDashboard from "./pages/UserDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

// 👉 Your test function
async function sendToAI(input) {
  const response = await fetch("http://localhost:5000/api/ai/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  const data = await response.json()
  console.log("AI says:", data)
  return data
}

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppContent = () => {
  // 👉 quick test: call AI when clicking button
  const handleAITest = async () => {
    const result = await sendToAI({ message: "Hello AI!" })
    alert("AI says: " + JSON.stringify(result))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/demo" element={<ToxicityDemo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 👉 Temporary AI test button */}
      <div className="p-4">
        <button
          onClick={handleAITest}
          className="px-4 py-2 rounded bg-blue-500 text-white"
        >
          Test AI
        </button>
      </div>
    </div>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
