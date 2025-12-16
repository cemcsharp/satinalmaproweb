// Onay Akışı Seed Script
// Usage: npx tsx prisma/seed-approval-workflow.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Talep onay akışı oluşturuluyor...");

    // Önce mevcut akışı sil (varsa)
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { name: "request_approval" }
    });

    if (existingWorkflow) {
        console.log("  ⏭️  Mevcut akış siliniyor...");
        await prisma.approvalStep.deleteMany({
            where: { workflowId: existingWorkflow.id }
        });
        await prisma.approvalWorkflow.delete({
            where: { id: existingWorkflow.id }
        });
    }

    // Yeni akış oluştur
    const workflow = await prisma.approvalWorkflow.create({
        data: {
            name: "request_approval",
            displayName: "Talep Onay Akışı",
            entityType: "Request",
            active: true,
            steps: {
                create: [
                    {
                        stepOrder: 1,
                        name: "Birim Müdürü Onayı",
                        description: "Talebin birim müdürü tarafından onaylanması gerekir",
                        approverRole: "birim_muduru",
                        required: true,
                        autoApprove: false
                    },
                    {
                        stepOrder: 2,
                        name: "Genel Müdür Onayı",
                        description: "Talebin genel müdür tarafından onaylanması gerekir",
                        approverRole: "genel_mudur",
                        required: true,
                        autoApprove: false,
                        budgetLimit: 50000 // 50.000 TL üzerinde GM onayı zorunlu
                    },
                    {
                        stepOrder: 3,
                        name: "Satınalma Havuzuna Gönderim",
                        description: "Talep satınalma müdürlüğüne iletilir",
                        approverRole: "satinalma_muduru",
                        required: true,
                        autoApprove: true // Otomatik olarak havuza düşer
                    }
                ]
            }
        },
        include: { steps: true }
    });

    console.log(`\n✅ Akış oluşturuldu: ${workflow.displayName}`);
    console.log("\n📋 Onay Adımları:");
    workflow.steps.forEach(step => {
        console.log(`   ${step.stepOrder}. ${step.name} (${step.approverRole})`);
    });

    console.log("\n✅ Onay akışı kurulumu tamamlandı!");
    console.log("\nNot: Talep durumları mevcut OptionItem yapısına bağlı olarak çalışacaktır.");
}

main()
    .catch(e => {
        console.error("Hata:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
