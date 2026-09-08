export const API_BASE =
    import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    };

    try {
        const res = await fetch(url, config);
        if (!res.ok) {
            let errMsg = `Request failed with status ${res.status}`;
            try {
                const errJson = await res.json();
                if (errJson && errJson.detail) {
                    errMsg =
                        typeof errJson.detail === "string"
                            ? errJson.detail
                            : JSON.stringify(errJson.detail);
                }
            } catch (_) {}
            throw new Error(errMsg);
        }
        if (res.status === 204) return null;
        return await res.json();
    } catch (err) {
        console.error(
            `API Error on [${options.method || "GET"}] ${endpoint}:`,
            err,
        );
        throw err;
    }
}

function toQueryString(params = {}) {
    const clean = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    return clean ? `?${clean}` : "";
}

export const api = {
    dashboard: {
        getSummary: (period = "this_month") =>
            request(`/api/dashboard/summary${toQueryString({ period })}`),
        getCategoryExpenses: (period = "this_month") =>
            request(
                `/api/dashboard/category-expenses${toQueryString({ period })}`,
            ),
        getMonthlySummary: (months = 6) =>
            request(
                `/api/dashboard/monthly-summary${toQueryString({ months })}`,
            ),
        getTrend: (period = "this_month") =>
            request(`/api/dashboard/trend${toQueryString({ period })}`),
        getInsights: () => request("/api/dashboard/insights"),
    },
    transactions: {
        list: (params = {}) =>
            request(`/api/transactions${toQueryString(params)}`),
        get: (id) => request(`/api/transactions/${id}`),
        create: (data) =>
            request("/api/transactions", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (id, data) =>
            request(`/api/transactions/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),
        delete: (id) =>
            request(`/api/transactions/${id}`, { method: "DELETE" }),
        getExportUrl: (params = {}) =>
            `${API_BASE}/api/transactions/export/csv${toQueryString(params)}`,
        uploadReceipt: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(
                `${API_BASE}/api/transactions/upload-receipt`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            if (!res.ok) throw new Error("Failed to upload receipt image");
            return await res.json();
        },
        scanInvoice: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(
                `${API_BASE}/api/transactions/scan-invoice`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            if (!res.ok) {
                let msg = "Failed to scan invoice";
                try {
                    const err = await res.json();
                    if (err?.detail) msg = err.detail;
                } catch (_) {}
                throw new Error(msg);
            }
            return await res.json();
        },
        importCsv: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_BASE}/api/transactions/import-csv`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "CSV import failed");
            return data;
        },
    },
    categories: {
        list: (type) => request(`/api/categories${toQueryString({ type })}`),
        create: (data) =>
            request("/api/categories", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (id, data) =>
            request(`/api/categories/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),
        delete: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
    },
    accounts: {
        list: () => request("/api/accounts"),
        get: (id) => request(`/api/accounts/${id}`),
        create: (data) =>
            request("/api/accounts", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (id, data) =>
            request(`/api/accounts/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),
        delete: (id) => request(`/api/accounts/${id}`, { method: "DELETE" }),
    },
    budgets: {
        list: (month, year) =>
            request(`/api/budgets${toQueryString({ month, year })}`),
        create: (data) =>
            request("/api/budgets", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (id, data) =>
            request(`/api/budgets/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),
        delete: (id) => request(`/api/budgets/${id}`, { method: "DELETE" }),
    },
    creditCards: {
        getSummary: () => request("/api/credit-cards/summary"),
        getTransactions: () => request("/api/credit-cards/transactions"),
        toggleStatus: (id) =>
            request(`/api/credit-cards/${id}/toggle-status`, {
                method: "PATCH",
            }),
    },
    insurance: {
        getSummary: () => request("/api/insurance/summary"),
        getTransactions: () => request("/api/insurance/transactions"),
    },
};
