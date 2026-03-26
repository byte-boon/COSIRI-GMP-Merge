import { useRoute } from "wouter";
import { Link } from "wouter";
import { Activity, Download, ChevronLeft, Bot } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CosiriRadar } from "@/components/CosiriRadar";
import { COSIRI_DATA } from "@/lib/cosiri-data";
import { useGetCosiriAssessment } from "@workspace/api-client-react";

export default function CosiriResults() {
  const [, params] = useRoute("/cosiri/results/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: assessment, isLoading } = useGetCosiriAssessment(id, { query: { enabled: !!id } });

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Activity className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  if (!assessment) return <AppLayout><div>Assessment not found</div></AppLayout>;

  // Prepare radar data
  const radarData = COSIRI_DATA.map(dim => {
    const answer = assessment.answers?.find(a => a.dimensionId === dim.id);
    return {
      subject: dim.name,
      score: answer ? answer.score : 0,
      fullMark: 5
    };
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/cosiri" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Assessment Results</h1>
            <p className="text-muted-foreground mt-1">Overall Band Score: <strong className="text-foreground text-lg ml-1">{assessment.overallScore}</strong></p>
          </div>
          <div className="flex gap-3">
            <Link href={`/cosiri/report/${id}`} className="px-4 py-2 bg-card border border-border shadow-sm rounded-lg font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" /> AI Insights
            </Link>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Maturity Profile</h3>
          <CosiriRadar data={radarData} />
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-bold text-lg">Dimension Breakdown</h3>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                {radarData.map(item => (
                  <tr key={item.subject} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-6 font-medium max-w-[200px] truncate" title={item.subject}>{item.subject}</td>
                    <td className="py-3 px-6 text-right">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${item.score >= 4 ? 'bg-green-100 text-green-700' : item.score >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {item.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
