import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { InterviewCard } from "@/components/dashboard/interview-card"
import { EmptyState } from "@/components/dashboard/empty-state"

export default async function DashboardPage() {
  const supabase = createClient()

  // Get all interviews without filtering by user
  const { data: interviews } = await supabase.from("interviews").select("*").order("created_at", { ascending: false })

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mock Interviews</h1>
        <Button asChild>
          <Link href="/interviews/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </div>

      {interviews && interviews.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
