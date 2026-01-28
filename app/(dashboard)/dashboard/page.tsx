import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { forms, responses, users, subRoles } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Users, ClipboardList, Tags } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  // Get statistics based on role
  let stats: { title: string; value: number; icon: React.ReactNode; description: string }[] = [];

  if (role === "superadmin") {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalForms] = await db.select({ count: count() }).from(forms);
    const [totalResponses] = await db.select({ count: count() }).from(responses);
    const [totalSubRoles] = await db.select({ count: count() }).from(subRoles);

    stats = [
      {
        title: "Total User",
        value: totalUsers.count,
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "Pengguna terdaftar",
      },
      {
        title: "Total Form",
        value: totalForms.count,
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        description: "Form yang dibuat",
      },
      {
        title: "Total Respon",
        value: totalResponses.count,
        icon: <ClipboardList className="h-4 w-4 text-muted-foreground" />,
        description: "Pengisian form",
      },
      {
        title: "Sub-Role",
        value: totalSubRoles.count,
        icon: <Tags className="h-4 w-4 text-muted-foreground" />,
        description: "Jenis teknisi",
      },
    ];
  } else if (role === "admin") {
    const [myForms] = await db
      .select({ count: count() })
      .from(forms)
      .where(eq(forms.createdById, session.user.id));
    const myFormIds = await db
      .select({ id: forms.id })
      .from(forms)
      .where(eq(forms.createdById, session.user.id));
    
    let responseCount = 0;
    if (myFormIds.length > 0) {
      for (const form of myFormIds) {
        const [formResponses] = await db
          .select({ count: count() })
          .from(responses)
          .where(eq(responses.formId, form.id));
        responseCount += formResponses.count;
      }
    }

    stats = [
      {
        title: "Form Saya",
        value: myForms.count,
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        description: "Form yang Anda buat",
      },
      {
        title: "Total Respon",
        value: responseCount,
        icon: <ClipboardList className="h-4 w-4 text-muted-foreground" />,
        description: "Respon dari semua form",
      },
    ];
  } else {
    // Teknisi
    const availableForms = session.user.subRoleId
      ? await db
          .select({ count: count() })
          .from(forms)
          .where(eq(forms.subRoleId, session.user.subRoleId))
      : [{ count: 0 }];
    
    const [myResponses] = await db
      .select({ count: count() })
      .from(responses)
      .where(eq(responses.userId, session.user.id));

    stats = [
      {
        title: "Form Tersedia",
        value: availableForms[0].count,
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        description: `Untuk ${session.user.subRoleName || "Anda"}`,
      },
      {
        title: "Pengisian Saya",
        value: myResponses.count,
        icon: <ClipboardList className="h-4 w-4 text-muted-foreground" />,
        description: "Form yang sudah diisi",
      },
    ];
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground/80">
          Selamat datang kembali, <span className="font-medium text-foreground">{session.user.name}</span>!
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="group hover-lift" style={{ animationDelay: `${index * 50}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground/70 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
