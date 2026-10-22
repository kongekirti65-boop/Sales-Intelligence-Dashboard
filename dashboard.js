// ==========================================
// SALES ANALYSIS DASHBOARD
// PEACH & CREAM THEME
// ==========================================

// Store chart instances so they can be updated.
let salesTrendChart = null;
let categoryChart = null;
let regionChart = null;
let productChart = null;


// ==========================================
// THEME COLORS
// ==========================================

const chartColors = {
    peach: "#E8A88D",
    peachLight: "#FBE3D6",
    peachDark: "#D98F73",

    apricot: "#E8B18F",
    coral: "#D98270",
    cream: "#F5D8BC",

    sage: "#91A78B",
    sageDark: "#719078",

    brown: "#59443D",
    brownLight: "#806B60",
    muted: "#A28B7F",

    grid: "#F0E3DA",
    border: "#FFFFFF",

    negative: "#C85E52",
    tooltipBackground: "#59443D"
};


// ==========================================
// FORMATTING HELPERS
// ==========================================

function formatCurrency(value) {

    return "$" + Number(value || 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function formatProfit(value) {

    const amount = Number(value || 0);

    if (amount < 0) {
        return "-$" + Math.abs(amount).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }

    return formatCurrency(amount);
}


// ==========================================
// SHARED CHART OPTIONS
// ==========================================

function getChartTooltipOptions() {

    return {
        backgroundColor: chartColors.tooltipBackground,
        titleColor: "#FFFFFF",
        bodyColor: "#FFF4E8",
        borderColor: chartColors.peach,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
    };
}


// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

async function loadDashboard() {

    try {

        const params = new URLSearchParams();

        const category = document.getElementById("categoryFilter");
        const region = document.getElementById("regionFilter");
        const startDate = document.getElementById("startDate");
        const endDate = document.getElementById("endDate");

        if (category && category.value) {
            params.append("category", category.value);
        }

        if (region && region.value) {
            params.append("region", region.value);
        }

        if (startDate && startDate.value) {
            params.append("start_date", startDate.value);
        }

        if (endDate && endDate.value) {
            params.append("end_date", endDate.value);
        }

        const response = await fetch(
            "/api/dashboard?" + params.toString()
        );

        if (!response.ok) {
            throw new Error("Unable to load dashboard data.");
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        console.log("Dashboard data received:", data);

        // MAIN DASHBOARD
        updateSummaryCards(data);

        populateFilters(data);

        createSalesTrendChart(data);

        createCategoryChart(data);

        createRegionChart(data);

        createProductChart(data);

        updateProductsTable(data);


        // FEATURE 1: PROFIT INTELLIGENCE
        updateProfitIntelligence(data);


        // FEATURE 2: SALES PERFORMANCE INSIGHTS
        updateSalesPerformanceInsights(data);

    } catch (error) {

        console.error("Dashboard error:", error);

        const lossTable = document.getElementById("lossProductsTable");

        if (lossTable) {

            lossTable.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-cell">
                        Unable to load loss-making products.
                        Please check the server.
                    </td>
                </tr>
            `;
        }

        const insightIds = [
            "topSalesCategory",
            "bestRegion",
            "mostProfitableCategory",
            "monthlySalesTrend"
        ];

        insightIds.forEach(function (id) {

            const element = document.getElementById(id);

            if (element) {
                element.textContent = "Unable to load";
            }

        });

    }
}


// ==========================================
// UPDATE SUMMARY CARDS
// ==========================================

function updateSummaryCards(data) {

    document.getElementById("totalSales").textContent =
        formatCurrency(data.total_sales);

    document.getElementById("totalProfit").textContent =
        formatCurrency(data.total_profit);

    document.getElementById("totalOrders").textContent =
        Number(data.total_orders || 0).toLocaleString("en-US");

    document.getElementById("totalQuantity").textContent =
        Number(data.total_quantity || 0).toLocaleString("en-US");
}


// ==========================================
// POPULATE FILTER DROPDOWNS
// ==========================================

function populateFilters(data) {

    const categoryFilter = document.getElementById("categoryFilter");

    const regionFilter = document.getElementById("regionFilter");

    if (categoryFilter && data.categories) {

        const currentCategory = categoryFilter.value;

        categoryFilter.innerHTML =
            '<option value="">All Categories</option>';

        data.categories.forEach(function (category) {

            const option = document.createElement("option");

            option.value = category;

            option.textContent = category;

            categoryFilter.appendChild(option);

        });

        categoryFilter.value = currentCategory;
    }

    if (regionFilter && data.regions) {

        const currentRegion = regionFilter.value;

        regionFilter.innerHTML =
            '<option value="">All Regions</option>';

        data.regions.forEach(function (region) {

            const option = document.createElement("option");

            option.value = region;

            option.textContent = region;

            regionFilter.appendChild(option);

        });

        regionFilter.value = currentRegion;
    }
}


// ==========================================
// SALES TREND CHART
// ==========================================

function createSalesTrendChart(data) {

    const canvas = document.getElementById("salesTrendChart");

    if (!canvas) return;

    if (salesTrendChart) {
        salesTrendChart.destroy();
    }

    salesTrendChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: data.sales_labels || [],

            datasets: [{

                label: "Sales",

                data: data.sales_values || [],

                borderColor: chartColors.peachDark,

                backgroundColor: "rgba(241, 182, 155, 0.25)",

                borderWidth: 3,

                fill: true,

                tension: 0.35,

                pointRadius: 4,

                pointHoverRadius: 6,

                pointBackgroundColor: chartColors.peach,

                pointBorderColor: "#FFFFFF",

                pointBorderWidth: 2,

                pointHoverBackgroundColor: chartColors.coral,

                pointHoverBorderColor: "#FFFFFF"

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {

                    labels: {
                        color: chartColors.brown,
                        usePointStyle: true,
                        padding: 18
                    }

                },

                tooltip: getChartTooltipOptions()

            },

            scales: {

                x: {

                    ticks: {
                        color: chartColors.brownLight,
                        maxRotation: 45,
                        minRotation: 0
                    },

                    grid: {
                        color: chartColors.grid
                    },

                    border: {
                        color: chartColors.grid
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: chartColors.brownLight,

                        callback: function (value) {
                            return "$" + Number(value).toLocaleString();
                        }

                    },

                    grid: {
                        color: chartColors.grid
                    },

                    border: {
                        display: false
                    }

                }

            }

        }

    });
}


// ==========================================
// SALES BY CATEGORY CHART
// ==========================================

function createCategoryChart(data) {

    const canvas = document.getElementById("categoryChart");

    if (!canvas) return;

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: data.category_labels || [],

            datasets: [{

                label: "Sales by Category",

                data: data.category_values || [],

                backgroundColor: [
                    "#D98F73",
                    "#E8B18F",
                    "#91A78B"
                ],

                hoverBackgroundColor: [
                    "#C87A60",
                    "#D99C79",
                    "#789474"
                ],

                borderColor: "#FFFFFF",

                borderWidth: 4,

                hoverOffset: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "62%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {
                        color: chartColors.brown,
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }

                },

                tooltip: {

                    ...getChartTooltipOptions(),

                    callbacks: {

                        label: function (context) {

                            return context.label + ": " +
                                formatCurrency(context.raw);

                        }

                    }

                }

            }

        }

    });
}


// ==========================================
// REGIONAL PERFORMANCE CHART
// ==========================================

function createRegionChart(data) {

    const canvas = document.getElementById("regionChart");

    if (!canvas) return;

    if (regionChart) {
        regionChart.destroy();
    }

    regionChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: data.region_labels || [],

            datasets: [{

                label: "Sales by Region",

                data: data.region_values || [],

                backgroundColor: [
                    "#D98F73",
                    "#E8B18F",
                    "#91A78B",
                    "#E8C9AA"
                ],

                hoverBackgroundColor: [
                    "#C87A60",
                    "#D99C79",
                    "#789474",
                    "#D9B38E"
                ],

                borderRadius: 8,

                borderSkipped: false,

                maxBarThickness: 55

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {
                        color: chartColors.brown,
                        usePointStyle: true
                    }

                },

                tooltip: getChartTooltipOptions()

            },

            scales: {

                x: {

                    ticks: {
                        color: chartColors.brownLight
                    },

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: chartColors.brownLight,

                        callback: function (value) {
                            return "$" + Number(value).toLocaleString();
                        }

                    },

                    grid: {
                        color: chartColors.grid
                    },

                    border: {
                        display: false
                    }

                }

            }

        }

    });
}


// ==========================================
// TOP PRODUCTS CHART
// ==========================================

function createProductChart(data) {

    const canvas = document.getElementById("productChart");

    if (!canvas) return;

    if (productChart) {
        productChart.destroy();
    }

    productChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: data.product_names || [],

            datasets: [{

                label: "Product Sales",

                data: data.product_sales || [],

                backgroundColor: "#E8B18F",

                hoverBackgroundColor: "#D98F73",

                borderRadius: 7,

                borderSkipped: false,

                maxBarThickness: 24

            }]

        },

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {
                        color: chartColors.brown,
                        usePointStyle: true
                    }

                },

                tooltip: getChartTooltipOptions()

            },

            scales: {

                x: {

                    beginAtZero: true,

                    ticks: {

                        color: chartColors.brownLight,

                        callback: function (value) {
                            return "$" + Number(value).toLocaleString();
                        }

                    },

                    grid: {
                        color: chartColors.grid
                    },

                    border: {
                        display: false
                    }

                },

                y: {

                    ticks: {
                        color: chartColors.brownLight
                    },

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    }

                }

            }

        }

    });
}


// ==========================================
// TOP PERFORMING PRODUCTS TABLE
// ==========================================

function updateProductsTable(data) {

    const tableBody = document.getElementById("topProductsTable");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    const names = data.product_names || [];

    const sales = data.product_sales || [];

    if (names.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-cell">
                    No product data available.
                </td>
            </tr>
        `;

        return;
    }

    names.forEach(function (name, index) {

        const row = document.createElement("tr");

        const rankCell = document.createElement("td");

        rankCell.textContent = index + 1;

        const nameCell = document.createElement("td");

        nameCell.textContent = name;

        const salesCell = document.createElement("td");

        salesCell.textContent = formatCurrency(sales[index]);

        row.appendChild(rankCell);

        row.appendChild(nameCell);

        row.appendChild(salesCell);

        tableBody.appendChild(row);

    });
}


// ==========================================
// FEATURE 1: PROFIT INTELLIGENCE
// ==========================================

function updateProfitIntelligence(data) {

    const countElement = document.getElementById("lossProductCount");

    const lossesElement = document.getElementById("totalProductLosses");

    const tableBody = document.getElementById("lossProductsTable");


    // Update the loss-making products count

    if (countElement) {

        countElement.textContent = Number(
            data.loss_product_count || 0
        ).toLocaleString("en-US");

    }


    // Update the combined losses

    if (lossesElement) {

        lossesElement.textContent = formatCurrency(
            data.total_product_losses || 0
        );

    }


    if (!tableBody) return;

    tableBody.innerHTML = "";

    const names = data.loss_product_names || [];

    const sales = data.loss_product_sales || [];

    const profits = data.loss_product_profits || [];


    if (names.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">
                    No loss-making products were found
                    for the selected filters.
                </td>
            </tr>
        `;

        return;
    }


    names.forEach(function (name, index) {

        const row = document.createElement("tr");


        // Rank

        const rankCell = document.createElement("td");

        rankCell.textContent = index + 1;


        // Product name

        const nameCell = document.createElement("td");

        nameCell.textContent = name;


        // Total sales

        const salesCell = document.createElement("td");

        salesCell.textContent = formatCurrency(sales[index]);


        // Total profit, displayed as a negative amount

        const profitCell = document.createElement("td");

        profitCell.textContent = formatProfit(profits[index]);

        profitCell.style.color = chartColors.negative;

        profitCell.style.fontWeight = "600";


        row.appendChild(rankCell);

        row.appendChild(nameCell);

        row.appendChild(salesCell);

        row.appendChild(profitCell);

        tableBody.appendChild(row);

    });
}


// ==========================================
// FEATURE 2: SALES PERFORMANCE INSIGHTS
// ==========================================

function updateSalesPerformanceInsights(data) {

    // --------------------------------------
    // INSIGHT 1: TOP SALES CATEGORY
    // --------------------------------------

    const topCategoryElement =
        document.getElementById("topSalesCategory");

    const topCategoryValueElement =
        document.getElementById("topSalesCategoryValue");


    if (topCategoryElement) {

        topCategoryElement.textContent =
            data.top_sales_category || "No data available";

    }


    if (topCategoryValueElement) {

        topCategoryValueElement.textContent =
            formatCurrency(data.top_sales_category_value || 0);

    }


    // --------------------------------------
    // INSIGHT 2: BEST-PERFORMING REGION
    // --------------------------------------

    const bestRegionElement =
        document.getElementById("bestRegion");

    const bestRegionSalesElement =
        document.getElementById("bestRegionSales");


    if (bestRegionElement) {

        bestRegionElement.textContent =
            data.best_region || "No data available";

    }


    if (bestRegionSalesElement) {

        bestRegionSalesElement.textContent =
            formatCurrency(data.best_region_sales || 0);

    }


    // --------------------------------------
    // INSIGHT 3: MOST PROFITABLE CATEGORY
    // --------------------------------------

    const profitableCategoryElement =
        document.getElementById("mostProfitableCategory");

    const profitableCategoryValueElement =
        document.getElementById("mostProfitableCategoryProfit");


    if (profitableCategoryElement) {

        profitableCategoryElement.textContent =
            data.most_profitable_category || "No data available";

    }


    if (profitableCategoryValueElement) {

        profitableCategoryValueElement.textContent =
            formatCurrency(
                data.most_profitable_category_profit || 0
            );

    }


    // --------------------------------------
    // INSIGHT 4: MONTHLY SALES TREND
    // --------------------------------------

    const monthlyTrendElement =
        document.getElementById("monthlySalesTrend");

    const monthlyChangeElement =
        document.getElementById("monthlySalesChange");


    if (!monthlyTrendElement || !monthlyChangeElement) {
        return;
    }


    const trend = data.monthly_sales_trend;

    const latestMonth = data.latest_month;

    const previousMonth = data.previous_month;


    // Check whether two months are available

    if (
        trend === "insufficient_data" ||
        !latestMonth ||
        !previousMonth
    ) {

        monthlyTrendElement.textContent = "Not enough data";

        monthlyChangeElement.textContent =
            "More than one month of sales data is needed.";

        return;
    }


    // Determine the direction of the trend

    if (trend === "increased") {

        monthlyTrendElement.textContent = "Sales Increased";

    } else if (trend === "decreased") {

        monthlyTrendElement.textContent = "Sales Decreased";

    } else {

        monthlyTrendElement.textContent = "Sales Unchanged";

    }


    // Calculate the change and percentage

    const change = Number(data.monthly_sales_change || 0);

    const percentage = data.monthly_sales_change_percent;


    let percentageText = "";

    if (
        percentage !== null &&
        percentage !== undefined &&
        Number.isFinite(Number(percentage))
    ) {

        percentageText =
            ` (${Number(percentage).toFixed(2)}%)`;

    }


    // Display the month-to-month comparison

    const monthText =
        `${latestMonth} compared with ${previousMonth}`;


    const changeText =
        `${formatCurrency(Math.abs(change))}${percentageText}`;


    monthlyChangeElement.textContent =
        `${changeText} — ${monthText}`;

}


// ==========================================
// APPLY AND RESET FILTERS
// ==========================================

function applyFilters() {

    const startDate = document.getElementById("startDate");

    const endDate = document.getElementById("endDate");


    if (
        startDate &&
        endDate &&
        startDate.value &&
        endDate.value &&
        startDate.value > endDate.value
    ) {

        alert("The start date cannot be later than the end date.");

        return;
    }


    loadDashboard();
}


function resetFilters() {

    const categoryFilter = document.getElementById("categoryFilter");

    const regionFilter = document.getElementById("regionFilter");

    const startDate = document.getElementById("startDate");

    const endDate = document.getElementById("endDate");


    if (categoryFilter) categoryFilter.value = "";

    if (regionFilter) regionFilter.value = "";

    if (startDate) startDate.value = "";

    if (endDate) endDate.value = "";


    loadDashboard();
}


// ==========================================
// START DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Initial dashboard load

    loadDashboard();


    // Filter event listeners

    const categoryFilter = document.getElementById("categoryFilter");

    const regionFilter = document.getElementById("regionFilter");

    const startDate = document.getElementById("startDate");

    const endDate = document.getElementById("endDate");


    if (categoryFilter) {

        categoryFilter.addEventListener("change", applyFilters);

    }


    if (regionFilter) {

        regionFilter.addEventListener("change", applyFilters);

    }


    if (startDate) {

        startDate.addEventListener("change", applyFilters);

    }


    if (endDate) {

        endDate.addEventListener("change", applyFilters);

    }


    // Apply Filters button

    const applyButton = document.getElementById("applyFilters");

    if (applyButton) {

        applyButton.addEventListener("click", applyFilters);

    }


    // Reset Filters button

    const resetButton = document.getElementById("resetFilters");

    if (resetButton) {

        resetButton.addEventListener("click", resetFilters);

    }

})