import { Button } from "@/components/ui/button";
import { FileText, Megaphone, GraduationCap } from "lucide-react";
import MetricsCards from "@/components/dashboard/MetricsCards";
import ClubStatus from "@/components/dashboard/ClubStatus";
import QuickStats from "@/components/dashboard/QuickStats";
import EventsChart from "@/components/dashboard/EventsChart";
import EventsTable from "@/components/dashboard/EventsTable";
import ComplaintsFeed from "@/components/dashboard/ComplaintsFeed";
import MediaBudget from "@/components/dashboard/MediaBudget";
import DayFlowCalendar from "@/components/dashboard/DayFlowCalendar";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-card-foreground">
                COLLEGE CLUBS MANAGEMENT
              </h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" /> Generate Report
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-primary border-0 hover:opacity-90">
              <Megaphone className="h-4 w-4" /> Send Announcement
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container py-6 space-y-6">
        <MetricsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ClubStatus />
          <QuickStats />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MediaBudget />
          </motion.div>
        </div>

        <EventsChart />

        <DayFlowCalendar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EventsTable />
          </div>
          <ComplaintsFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
