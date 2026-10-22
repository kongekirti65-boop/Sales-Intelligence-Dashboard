
const CSV_URL = "https://kongekirti65-boop.github.io/Sales-Intelligence-Dashboard/Sample%20-%20Superstore.csv";

let salesTrendChart, categoryChart, regionChart, productChart;
let allRows = [];

const colors = {
    peach: "#D98F73",
    apricot: "#E8B18F",
    sage: "#91A78B",
    cream: "#E8C9AA",
    brown: "#59443D",
    grid: "#F0E3DA",
    red: "#C85E52"
};

function money(value) {
    return "$" + Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function number(value) {
    return Number(value || 0).toLocaleString("en-US");
}

function cleanNumber(value) {
    return Number(String(value ?? "0").replace(/[$,]/g, "")) || 0;
}

function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function getValue(row, names) {
    const key = Object.keys(row).find(k =>
        names.includes(k.trim().toLowerCase())
    );
    return key ? row[key] : "";
}

function normalizeRow(row) {
    const date = parseDate(getValue(row, ["order date", "sale_date", "sale date"]));
    return {
        date,
        category: String(getValue(row, ["category", "product_category"]) || "Unknown").trim(),
        region: String(getValue(row, ["region"]) || "Unknown").trim(),
        product: String(getValue(row, ["product name", "product_name", "product"]) || "Unknown").trim(),
        orderId: String(getValue(row, ["order id", "order_id"]) || "").trim(),
        sales: cleanNumber(getValue(row, ["sales", "sales_amount", "revenue"])),
        profit: cleanNumber(getValue(row, ["profit", "total_profit"])),
        quantity: cleanNumber(getValue(row, ["quantity", "quantity_sold"]))
    };
}

function sum(rows, key) {
    return rows.reduce((total, row) => total + row[key], 0);
}

function groupSum(rows, groupKey, valueKey) {
    const result = {};
    rows.forEach(row => {
        const key = row[groupKey] || "Unknown";
        result[key] = (result[key] || 0) + row[valueKey];
    });
    return result;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function fillSelect(id, values, allLabel) {
    const select = document.getElementById(id);
    if (!select) return;
    const previous = select.value;
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    select.appendChild(all);

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    if (values.includes(previous)) select.value = previous;
}

function getFilteredRows() {
    const category = document.getElementById("categoryFilter")?.value || "";
    const region = document.getElementById("regionFilter")?.value || "";
    const start = document.getElementById("startDate")?.value || "";
    const end = document.getElementById("endDate")?.value || "";

    return allRows.filter(row => {
        if (category && row.category !== category) return false;
        if (region && row.region !== region) return false;
        if (start && (!row.date || row.date < new Date(start + "T00:00:00"))) return false;
        if (end && (!row.date || row.date > new Date(end + "T23:59:59"))) return false;
        return true;
    });
}

function makeChart(oldChart, canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return oldChart;
    if (oldChart) oldChart.destroy();
    return new Chart(canvas, config);
}

function renderDashboard() {
    const rows = getFilteredRows();

    if (!rows.length) {
        ["totalSales", "totalProfit", "totalOrders", "totalQuantity"].forEach(id =>
            setText(id, "No data")
        );
        setText("topSalesCategory", "No data");
        setText("bestRegion", "No data");
        setText("mostProfitableCategory", "No data");
        setText("monthlySalesTrend", "No data");
        return;
    }

    const totalSales = sum(rows, "sales");
    const totalProfit = sum(rows, "profit");
    const totalQuantity = sum(rows, "quantity");
    const orderIds = new Set(rows.map(r => r.orderId).filter(Boolean));

    setText("totalSales", money(totalSales));
    setText("totalProfit", money(totalProfit));
    setText("totalOrders", number(orderIds.size || rows.length));
    setText("totalQuantity", number(totalQuantity));

    const categorySales = groupSum(rows, "category", "sales");
    const regionSales = groupSum(rows, "region", "sales");
    const categoryProfit = groupSum(rows, "category", "profit");

    const categoryEntries = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
    const regionEntries = Object.entries(regionSales).sort((a, b) => b[1] - a[1]);
    const profitEntries = Object.entries(categoryProfit).sort((a, b) => b[1] - a[1]);

    setText("topSalesCategory", categoryEntries[0]?.[0] || "No data");
    setText("topSalesCategoryValue", money(categoryEntries[0]?.[1] || 0));
    setText("bestRegion", regionEntries[0]?.[0] || "No data");
    setText("bestRegionSales", money(regionEntries[0]?.[1] || 0));
    setText("mostProfitableCategory", profitEntries[0]?.[0] || "No data");
    setText("mostProfitableCategoryProfit", money(profitEntries[0]?.[1] || 0));

    const monthly = {};
    rows.forEach(row => {
        if (!row.date) return;
        const key = row.date.getFullYear() + "-" +
            String(row.date.getMonth() + 1).padStart(2, "0");
        monthly[key] = (monthly[key] || 0) + row.sales;
    });

    const months = Object.keys(monthly).sort();
    const monthLabels = months.map(key => {
        const [year, month] = key.split("-");
        return new Date(Number(year), Number(month) - 1, 1)
            .toLocaleDateString("en-US", { month: "short", year: "numeric" });
    });

    const monthlyValues = months.map(key => monthly[key]);
    const last = months.length ? monthly[months.length - 1] : null;
    const previous = months.length > 1 ? months[months.length - 2] : null;

    if (last && previous) {
        const change = monthly[last] - monthly[previous];
        const pct = monthly[previous] ? change / monthly[previous] * 100 : 0;
        setText("monthlySalesTrend", change > 0 ? "Sales Increased" :
            change < 0 ? "Sales Decreased" : "Sales Unchanged");
        setText("monthlySalesChange",
            `${money(Math.abs(change))} (${pct.toFixed(2)}%) — ${last} compared with ${previous}`);
    } else {
        setText("monthlySalesTrend", "Not enough data");
        setText("monthlySalesChange", "More than one month of data is needed.");
    }

    salesTrendChart = makeChart(salesTrendChart, "salesTrendChart", {
        type: "line",
        data: {
            labels: monthLabels,
            datasets: [{
                label: "Sales",
                data: monthlyValues,
                borderColor: colors.peach,
                backgroundColor: "rgba(232,168,141,0.25)",
                fill: true,
                tension: 0.35
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    categoryChart = makeChart(categoryChart, "categoryChart", {
        type: "doughnut",
        data: {
            labels: categoryEntries.map(e => e[0]),
            datasets: [{
                data: categoryEntries.map(e => e[1]),
                backgroundColor: [colors.peach, colors.apricot, colors.sage, colors.cream]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    regionChart = makeChart(regionChart, "regionChart", {
        type: "bar",
        data: {
            labels: regionEntries.map(e => e[0]),
            datasets: [{
                label: "Sales by Region",
                data: regionEntries.map(e => e[1]),
                backgroundColor: [colors.peach, colors.apricot, colors.sage, colors.cream]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const products = groupSum(rows, "product", "sales");
    const productEntries = Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 5);

    productChart = makeChart(productChart, "productChart", {
        type: "bar",
        data: {
            labels: productEntries.map(e => e[0]),
            datasets: [{
                label: "Product Sales",
                data: productEntries.map(e => e[1]),
                backgroundColor: colors.apricot
            }]
        },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false }
    });

    const topBody = document.getElementById("topProductsTable");
    if (topBody) {
        topBody.innerHTML = "";
        productEntries.forEach((entry, index) => {
            const row = document.createElement("tr");
            [index + 1, entry[0], money(entry[1])].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            topBody.appendChild(row);
        });
    }

    const productProfit = groupSum(rows, "product", "profit");
    const productRows = Object.keys(productProfit)
        .filter(name => productProfit[name] < 0)
        .sort((a, b) => productProfit[a] - productProfit[b])
        .slice(0, 10);

    setText("lossProductCount", number(Object.keys(productProfit).filter(name => productProfit[name] < 0).length));
    setText("totalProductLosses", money(Math.abs(
        Object.values(productProfit).filter(value => value < 0).reduce((a, b) => a + b, 0)
    )));

    const lossBody = document.getElementById("lossProductsTable");
    if (lossBody) {
        lossBody.innerHTML = "";
        productRows.forEach((name, index) => {
            const row = document.createElement("tr");
            [index + 1, name, money(sum(rows.filter(r => r.product === name), "sales")),
                money(productProfit[name])].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                if (typeof value === "string" && value.startsWith("-$")) cell.style.color = colors.red;
                row.appendChild(cell);
            });
            lossBody.appendChild(row);
        });
        if (!productRows.length) {
            lossBody.innerHTML = '<tr><td colspan="4">No loss-making products found.</td></tr>';
        }
    }
}

async function loadDashboard() {
    const statusIds = ["totalSales", "totalProfit", "totalOrders", "totalQuantity"];
    try {
        setText("totalSales", "Loading...");
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("CSV could not be downloaded.");
        const csvText = await response.text();

        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        });

        allRows = parsed.data.map(normalizeRow).filter(row =>
            row.date && row.category && row.region
        );

        if (!allRows.length) {
            throw new Error("No usable rows found. Check the CSV column names and date format.");
        }

        fillSelect("categoryFilter",
            [...new Set(allRows.map(row => row.category))].sort(),
            "All Categories"
        );
        fillSelect("regionFilter",
            [...new Set(allRows.map(row => row.region))].sort(),
            "All Regions"
        );

        renderDashboard();
        console.log("Loaded CSV rows:", allRows.length);
    } catch (error) {
        console.error("Dashboard loading failed:", error);
        statusIds.forEach(id => setText(id, "Load failed"));
        setText("topSalesCategory", "Load failed");
        setText("bestRegion", "Load failed");
        setText("mostProfitableCategory", "Load failed");
        setText("monthlySalesTrend", "Load failed");

        const lossBody = document.getElementById("lossProductsTable");
        if (lossBody) {
            lossBody.innerHTML = `<tr><td colspan="4">Could not load data: ${error.message}</td></tr>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();

    ["categoryFilter", "regionFilter", "startDate", "endDate"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", renderDashboard);
    });

    document.getElementById("applyFilters")?.addEventListener("click", renderDashboard);

    document.getElementById("resetFilters")?.addEventListener("click", () => {
        ["categoryFilter", "regionFilter", "startDate", "endDate"].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = "";
        });
        renderDashboard();
    });
});
