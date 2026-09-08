import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Budgets } from "./pages/Budgets";
import { Accounts } from "./pages/Accounts";
import { Categories } from "./pages/Categories";
import { CreditCards } from "./pages/CreditCards";
import { InsuranceMedical } from "./pages/InsuranceMedical";
import { Insights } from "./pages/Insights";
import { DemoTestManager } from "./pages/DemoTestManager";

export const App = () => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="credit-cards" element={<CreditCards />} />
                <Route
                    path="insurance-medical"
                    element={<InsuranceMedical />}
                />
                <Route path="categories" element={<Categories />} />
                <Route path="insights" element={<Insights />} />
                <Route path="demo-tests" element={<DemoTestManager />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};
