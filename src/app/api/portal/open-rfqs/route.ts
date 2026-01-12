import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET: Fetch open RFQs for the logged-in supplier based on their category
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        // Get the supplier for this user with all their categories
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                supplier: {
                    include: {
                        category: true,
                        categories: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            }
        });

        if (!user?.supplier) {
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        const supplier = user.supplier;

        // Collect all category IDs (primary + additional)
        const categoryIds: string[] = [];
        if (supplier.categoryId) {
            categoryIds.push(supplier.categoryId);
        }
        // Add categories from many-to-many mapping
        if (supplier.categories && supplier.categories.length > 0) {
            supplier.categories.forEach((mapping: any) => {
                if (mapping.categoryId && !categoryIds.includes(mapping.categoryId)) {
                    categoryIds.push(mapping.categoryId);
                }
            });
        }

        // Find open RFQs that match supplier's categories
        // For marketplace: show ALL open RFQs if supplier has no categories
        const openRfqs = await prisma.rfq.findMany({
            where: {
                status: "OPEN",
                deadline: {
                    gte: new Date() // Only future deadlines
                },
                // Category matching: if supplier has categories, filter by them
                // Otherwise, show all open RFQs
                ...(categoryIds.length > 0 && {
                    items: {
                        some: {
                            categoryId: {
                                in: categoryIds
                            }
                        }
                    }
                })
            },
            include: {
                items: {
                    include: {
                        category: true
                    }
                },
                suppliers: {
                    where: {
                        supplierId: supplier.id
                    },
                    include: {
                        offer: true
                    }
                }
            },
            orderBy: {
                deadline: 'asc'
            }
        });

        // Format response
        const rfqs = openRfqs.map(rfq => {
            const participation = rfq.suppliers[0];
            const categories = [...new Set(rfq.items.map(i => i.category?.name).filter(Boolean))];

            return {
                id: rfq.id,
                rfxCode: rfq.rfxCode,
                title: rfq.title,
                deadline: rfq.deadline?.toISOString() || null,
                status: rfq.status,
                itemCount: rfq.items.length,
                categoryName: categories.length > 0 ? categories.join(", ") : null,
                hasExistingOffer: !!participation?.offer,
                token: participation?.token || null
            };
        });

        return NextResponse.json({ ok: true, rfqs });
    } catch (error) {
        console.error("Open RFQs error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
