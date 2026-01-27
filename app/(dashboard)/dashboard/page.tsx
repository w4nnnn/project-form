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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {session.user.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
