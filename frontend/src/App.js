import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthPage from "@/pages/AuthPage";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Prospects from "@/pages/Prospects";
import FollowUps from "@/pages/FollowUps";
import Attendance from "@/pages/Attendance";
import Challenges from "@/pages/Challenges";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Teams from "@/pages/Teams";
import MyTeam from "@/pages/MyTeam";
import Reports from "@/pages/Reports";
import Missions from "@/pages/Missions";
import WeeklyAttendance from "@/pages/WeeklyAttendance";
import Seasons from "@/pages/Seasons";
import Tasks from "@/pages/Tasks";
import TeamLeague from "@/pages/TeamLeague";
import SpartansLeague from "@/pages/SpartansLeague";
import Rewards from "@/pages/Rewards";
import Goals from "@/pages/Goals";
import "@/App.css";

function Router() {
    const location = useLocation();
    // Handle Emergent Google OAuth callback synchronously during render
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <AppLayout><Dashboard /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/prospects"
                element={
                    <ProtectedRoute>
                        <AppLayout><Prospects /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/followups"
                element={
                    <ProtectedRoute>
                        <AppLayout><FollowUps /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/attendance"
                element={
                    <ProtectedRoute>
                        <AppLayout><Attendance /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/challenges"
                element={
                    <ProtectedRoute>
                        <AppLayout><Challenges /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/leaderboard"
                element={
                    <ProtectedRoute>
                        <AppLayout><Leaderboard /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <AppLayout><Profile /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute roles={["super_admin"]}>
                        <AppLayout><Admin /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/teams"
                element={
                    <ProtectedRoute roles={["super_admin"]}>
                        <AppLayout><Teams /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my-team"
                element={
                    <ProtectedRoute roles={["team_leader"]}>
                        <AppLayout><MyTeam /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <AppLayout><Reports /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/missions"
                element={
                    <ProtectedRoute>
                        <AppLayout><Missions /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/weekly-attendance"
                element={
                    <ProtectedRoute>
                        <AppLayout><WeeklyAttendance /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/seasons"
                element={
                    <ProtectedRoute>
                        <AppLayout><Seasons /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tasks"
                element={
                    <ProtectedRoute>
                        <AppLayout><Tasks /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/team-league"
                element={
                    <ProtectedRoute>
                        <AppLayout><TeamLeague /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/spartans-league"
                element={
                    <ProtectedRoute>
                        <AppLayout><SpartansLeague /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/rewards"
                element={
                    <ProtectedRoute>
                        <AppLayout><Rewards /></AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/goals"
                element={
                    <ProtectedRoute>
                        <AppLayout><Goals /></AppLayout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default function App() {
    return (
        <div className="App min-h-screen bg-[#050507] dark">
            <BrowserRouter>
                <AuthProvider>
                    <Router />
                    <Toaster
                        theme="dark"
                        position="top-center"
                        toastOptions={{
                            style: {
                                background: "#121215",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                            },
                        }}
                    />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}
