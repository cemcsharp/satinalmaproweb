import React from "react";
import classNames from "classnames";

type StepStatus = "completed" | "current" | "pending" | "rejected";

interface ApprovalStep {
    id: string;
    stepOrder: number;
    name: string;
    status?: StepStatus;
    approvedCount?: number;
    requiredCount?: number;
    approverRole?: string;
}

interface Workflow {
    id: string;
    name: string;
    displayName: string;
    steps: ApprovalStep[];
}

interface ApprovalStatusProps {
    workflow?: Workflow;
    className?: string;
}

export default function ApprovalStatus({ workflow, className }: ApprovalStatusProps) {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) return null;

    return (
        <div className={classNames("py-4", className)}>
            <div className="flex items-center w-full">
                {workflow.steps.map((step, index) => {
                    const isLast = index === workflow.steps.length - 1;
                    const status = step.status || "pending";

                    let circleColor = "bg-slate-200 text-slate-500 border-slate-300";
                    let lineColor = "bg-slate-200";

                    if (status === "completed") {
                        circleColor = "bg-green-600 text-white border-green-600";
                        lineColor = "bg-green-600";
                    } else if (status === "current") {
                        circleColor = "bg-blue-600 text-white border-blue-600 animate-pulse";
                        lineColor = "bg-slate-200";
                    } else if (status === "rejected") {
                        circleColor = "bg-red-600 text-white border-red-600";
                        lineColor = "bg-slate-200";
                    }

                    // Partial approval indicator (e.g. 1/2)
                    const showCount = (step.requiredCount || 1) > 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Circle & Label Container */}
                            <div className="relative flex flex-col items-center group">
                                {/* Connector Line (Left part for this step, but easier to draw line AFTER) */}

                                <div className={classNames(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold z-10 transition-colors duration-300",
                                    circleColor
                                )}>
                                    {status === "completed" ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : status === "rejected" ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    ) : (
                                        step.stepOrder
                                    )}
                                </div>

                                {/* Label */}
                                <div className="absolute top-10 w-32 text-center">
                                    <div className={classNames("text-xs font-medium mb-1",
                                        status === "current" ? "text-blue-700" :
                                            status === "completed" ? "text-green-700" :
                                                status === "rejected" ? "text-red-700" : "text-slate-500"
                                    )}>
                                        {step.name}
                                    </div>
                                    {showCount && (
                                        <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full inline-block text-slate-600 border border-slate-200">
                                            {step.approvedCount || 0}/{step.requiredCount} Onay
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Connector Line to Next Step */}
                            {!isLast && (
                                <div className={classNames("flex-1 h-0.5 mx-2 mb-8", // mb-8 to align with circle center roughly? Circle is h-8, so top-0 relative? No, default align center.
                                    status === "completed" ? "bg-green-600" : "bg-slate-200"
                                )}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
