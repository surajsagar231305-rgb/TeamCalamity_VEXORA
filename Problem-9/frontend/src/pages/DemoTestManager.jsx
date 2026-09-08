import React, { useState } from "react";
import {
    CheckCircle2,
    CircleAlert,
    Loader2,
    Play,
    Server,
    TestTube2,
} from "lucide-react";
import { API_BASE, api } from "../api/client";
import { formatCurrency } from "../utils/formatters";

const INITIAL_TESTS = [
    {
        id: "health",
        label: "API health check",
        detail: "FastAPI responds successfully.",
    },
    {
        id: "dashboard",
        label: "Dashboard analytics",
        detail: "Summary and charts return live data.",
    },
    {
        id: "transactions",
        label: "Transaction listing",
        detail: "Expense records are readable and sorted.",
    },
    {
        id: "accounts",
        label: "Accounts and wallets",
        detail: "Account balances are available.",
    },
    {
        id: "budgets",
        label: "Budget controls",
        detail: "Budget records are available.",
    },
    {
        id: "scanner",
        label: "AI receipt scanner",
        detail: "The bundled USD demo receipt is classified.",
    },
];

export const DemoTestManager = () => {
    const [tests, setTests] = useState(
        INITIAL_TESTS.map((test) => ({ ...test, status: "idle", message: "" })),
    );
    const [running, setRunning] = useState(false);

    const updateTest = (id, patch) => {
        setTests((current) =>
            current.map((test) =>
                test.id === id ? { ...test, ...patch } : test,
            ),
        );
    };

    const runTest = async (test) => {
        updateTest(test.id, { status: "running", message: "" });
        try {
            if (test.id === "health") {
                const result = await fetch(`${API_BASE}/api/health`).then(
                    (response) => response.json(),
                );
                if (result.status !== "healthy")
                    throw new Error("API did not report healthy");
                updateTest(test.id, { status: "passed", message: "Healthy" });
            } else if (test.id === "dashboard") {
                const result = await api.dashboard.getSummary();
                updateTest(test.id, {
                    status: "passed",
                    message: `${formatCurrency(result.total_expenses)} tracked`,
                });
            } else if (test.id === "transactions") {
                const result = await api.transactions.list({ limit: 1 });
                updateTest(test.id, {
                    status: "passed",
                    message: `${result.total} records available`,
                });
            } else if (test.id === "accounts") {
                const result = await api.accounts.list();
                updateTest(test.id, {
                    status: "passed",
                    message: `${result.length} accounts available`,
                });
            } else if (test.id === "budgets") {
                const result = await api.budgets.list();
                updateTest(test.id, {
                    status: "passed",
                    message: `${result.length} budgets available`,
                });
            } else if (test.id === "scanner") {
                const image = await fetch(
                    `${API_BASE}/uploads/sample_usd_debit_receipt.png`,
                ).then((response) => {
                    if (!response.ok)
                        throw new Error("Demo receipt is unavailable");
                    return response.blob();
                });
                const formData = new FormData();
                formData.append("file", image, "sample_usd_debit_receipt.png");
                const result = await fetch(
                    `${API_BASE}/api/transactions/scan-invoice`,
                    { method: "POST", body: formData },
                ).then(async (response) => {
                    if (!response.ok)
                        throw new Error(
                            (await response.json()).detail ||
                                "Scanner request failed",
                        );
                    return response.json();
                });
                if (result.original_amount !== 49)
                    throw new Error(
                        `Detected ${result.original_amount} instead of $49`,
                    );
                updateTest(test.id, {
                    status: "passed",
                    message: "Detected USD 49.00 debit receipt",
                });
            }
        } catch (error) {
            updateTest(test.id, {
                status: "failed",
                message: error.message || "Request failed",
            });
        }
    };

    const runAll = async () => {
        setRunning(true);
        for (const test of INITIAL_TESTS) await runTest(test);
        setRunning(false);
    };

    const passed = tests.filter((test) => test.status === "passed").length;
    const failed = tests.filter((test) => test.status === "failed").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                        <TestTube2 className="w-4 h-4" /> Demo verification
                    </div>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Demo Test Manager
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Run live checks against the connected API before
                        presenting the app.
                    </p>
                </div>
                <button
                    onClick={runAll}
                    disabled={running}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 disabled:opacity-60">
                    {running ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                    {running ? "Running checks..." : "Run all checks"}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-wider text-slate-400">
                        Checks
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {tests.length}
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Passed
                    </div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        {passed}
                    </div>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
                    <div className="text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        Failed
                    </div>
                    <div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400">
                        {failed}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    <Server className="w-4 h-4 text-indigo-500" /> Connected
                    API:{" "}
                    <span className="font-mono text-xs text-slate-500 break-all">
                        {API_BASE}
                    </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tests.map((test) => (
                        <div
                            key={test.id}
                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                {test.status === "passed" ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                ) : test.status === "failed" ? (
                                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                                ) : test.status === "running" ? (
                                    <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-indigo-500" />
                                ) : (
                                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                                )}
                                <div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                        {test.label}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {test.message || test.detail}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => runTest(test)}
                                disabled={test.status === "running" || running}
                                className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:self-auto">
                                Run
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
