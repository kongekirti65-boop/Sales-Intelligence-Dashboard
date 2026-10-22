import os
import pandas as pd


# ==========================================
# PROJECT PATHS
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "Sample - Superstore.csv"
)

# ==========================================
# LOAD AND CLEAN SALES DATA
# ==========================================

def load_sales_data():
    """Load and clean the sales dataset."""

    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(
            f"Dataset not found at: {DATA_FILE}"
        )

    df = pd.read_csv(
        DATA_FILE,
        encoding="latin1"
    )

    df.columns = df.columns.str.strip()

    # Convert date columns
    for column in ["Order Date", "Ship Date"]:

        if column in df.columns:
            df[column] = pd.to_datetime(
                df[column],
                errors="coerce"
            )

    # Validate required numeric columns
    required_columns = [
        "Sales",
        "Profit",
        "Quantity"
    ]

    for column in required_columns:

        if column not in df.columns:
            raise ValueError(
                f"Missing required column: {column}"
            )

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    # Remove records with missing required values
    df = df.dropna(
        subset=required_columns
    )

    return df


# ==========================================
# DASHBOARD DATA ANALYSIS
# ==========================================

def get_dashboard_data(df):
    """Calculate dashboard statistics and insights."""

    # ==========================================
    # MAIN STATISTICS
    # ==========================================

    total_sales = round(
        float(df["Sales"].sum()), 2
    )

    total_profit = round(
        float(df["Profit"].sum()), 2
    )

    total_quantity = int(
        df["Quantity"].sum()
    )

    if "Order ID" in df.columns:

        total_orders = int(
            df["Order ID"].nunique()
        )

    else:
        total_orders = len(df)

    # ==========================================
    # MONTHLY SALES
    # ==========================================

    if "Order Date" in df.columns:

        monthly_df = df.dropna(
            subset=["Order Date"]
        ).copy()

        monthly_df["Month"] = (
            monthly_df["Order Date"]
            .dt.to_period("M")
            .astype(str)
        )

        monthly_sales = (
            monthly_df.groupby("Month")["Sales"]
            .sum()
            .sort_index()
        )

        sales_labels = monthly_sales.index.tolist()

        sales_values = (
            monthly_sales.round(2).tolist()
        )

    else:

        monthly_sales = pd.Series(
            dtype="float64"
        )

        sales_labels = []
        sales_values = []

    # ==========================================
    # SALES BY CATEGORY
    # ==========================================

    if "Category" in df.columns:

        category_data = (
            df.groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        category_labels = category_data.index.tolist()

        category_values = (
            category_data.round(2).tolist()
        )

    else:

        category_data = pd.Series(
            dtype="float64"
        )

        category_labels = []
        category_values = []

    # ==========================================
    # TOP FIVE PRODUCTS BY SALES
    # ==========================================

    if "Product Name" in df.columns:

        top_products = (
            df.groupby("Product Name")["Sales"]
            .sum()
            .sort_values(ascending=False)
            .head(5)
        )

        product_names = top_products.index.tolist()

        product_sales = (
            top_products.round(2).tolist()
        )

    else:

        product_names = []
        product_sales = []

    # ==========================================
    # SALES BY REGION
    # ==========================================

    if "Region" in df.columns:

        region_data = (
            df.groupby("Region")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        region_labels = region_data.index.tolist()

        region_values = (
            region_data.round(2).tolist()
        )

    else:

        region_data = pd.Series(
            dtype="float64"
        )

        region_labels = []
        region_values = []

    # ==========================================
    # PROFIT BY CATEGORY
    # ==========================================

    if "Category" in df.columns:

        category_profit = (
            df.groupby("Category")["Profit"]
            .sum()
            .sort_values(ascending=False)
        )

    else:

        category_profit = pd.Series(
            dtype="float64"
        )

    # ==========================================
    # SALES PERFORMANCE INSIGHTS
    # RULE-BASED ANALYSIS — NO AI
    # ==========================================

    # Insight 1: Category with highest sales
    if not category_data.empty:

        top_sales_category = str(
            category_data.idxmax()
        )

        top_sales_category_value = round(
            float(category_data.max()), 2
        )

    else:

        top_sales_category = "No data available"
        top_sales_category_value = 0.0

    # Insight 2: Region with highest sales
    if not region_data.empty:

        best_region = str(
            region_data.idxmax()
        )

        best_region_sales = round(
            float(region_data.max()), 2
        )

    else:

        best_region = "No data available"
        best_region_sales = 0.0

    # Insight 3: Category with highest profit
    if not category_profit.empty:

        most_profitable_category = str(
            category_profit.idxmax()
        )

        most_profitable_category_profit = round(
            float(category_profit.max()), 2
        )

    else:

        most_profitable_category = "No data available"
        most_profitable_category_profit = 0.0

    # Insight 4: Compare the latest two months
    if len(monthly_sales) >= 2:

        latest_month = str(
            monthly_sales.index[-1]
        )

        previous_month = str(
            monthly_sales.index[-2]
        )

        latest_month_sales = float(
            monthly_sales.iloc[-1]
        )

        previous_month_sales = float(
            monthly_sales.iloc[-2]
        )

        monthly_sales_change = round(
            latest_month_sales - previous_month_sales,
            2
        )

        if previous_month_sales != 0:

            monthly_sales_change_percent = round(
                (
                    monthly_sales_change
                    / abs(previous_month_sales)
                ) * 100,
                2
            )

        else:

            monthly_sales_change_percent = None

        if monthly_sales_change > 0:

            monthly_sales_trend = "increased"

        elif monthly_sales_change < 0:

            monthly_sales_trend = "decreased"

        else:

            monthly_sales_trend = "unchanged"

    else:

        latest_month = (
            str(monthly_sales.index[-1])
            if len(monthly_sales) == 1
            else "Not available"
        )

        previous_month = "Not available"

        latest_month_sales = (
            float(monthly_sales.iloc[-1])
            if len(monthly_sales) == 1
            else 0.0
        )

        previous_month_sales = 0.0
        monthly_sales_change = 0.0
        monthly_sales_change_percent = None
        monthly_sales_trend = "insufficient_data"

    # ==========================================
    # LOSS-MAKING PRODUCTS DETECTOR
    # ==========================================

    if (
        "Product Name" in df.columns
        and "Profit" in df.columns
        and "Sales" in df.columns
    ):

        product_performance = (
            df.groupby("Product Name")
            .agg(
                total_sales=("Sales", "sum"),
                total_profit=("Profit", "sum")
            )
            .reset_index()
        )

        loss_products = product_performance[
            product_performance["total_profit"] < 0
        ].copy()

        loss_products = loss_products.sort_values(
            by="total_profit",
            ascending=True
        )

        loss_product_count = int(
            len(loss_products)
        )

        total_product_losses = round(
            float(
                -loss_products["total_profit"].sum()
            ),
            2
        )

        top_loss_products = loss_products.head(10)

        loss_product_names = (
            top_loss_products["Product Name"].tolist()
        )

        loss_product_sales = (
            top_loss_products["total_sales"]
            .round(2).tolist()
        )

        loss_product_profits = (
            top_loss_products["total_profit"]
            .round(2).tolist()
        )

    else:

        loss_product_count = 0
        total_product_losses = 0.0
        loss_product_names = []
        loss_product_sales = []
        loss_product_profits = []

    # ==========================================
    # RETURN ALL DASHBOARD DATA
    # ==========================================

    return {

        # Main statistics
        "total_sales": total_sales,
        "total_profit": total_profit,
        "total_orders": total_orders,
        "total_quantity": total_quantity,

        # Monthly sales chart
        "sales_labels": sales_labels,
        "sales_values": sales_values,

        # Category chart
        "category_labels": category_labels,
        "category_values": category_values,

        # Top products chart and table
        "product_names": product_names,
        "product_sales": product_sales,

        # Regional sales chart
        "region_labels": region_labels,
        "region_values": region_values,

        # Profit Intelligence
        "loss_product_count": loss_product_count,
        "total_product_losses": total_product_losses,
        "loss_product_names": loss_product_names,
        "loss_product_sales": loss_product_sales,
        "loss_product_profits": loss_product_profits,

        # Sales Performance Insights
        "top_sales_category": top_sales_category,
        "top_sales_category_value": top_sales_category_value,

        "best_region": best_region,
        "best_region_sales": best_region_sales,

        "most_profitable_category": most_profitable_category,
        "most_profitable_category_profit":
            most_profitable_category_profit,

        "latest_month": latest_month,
        "latest_month_sales": round(
            latest_month_sales, 2
        ),

        "previous_month": previous_month,
        "previous_month_sales": round(
            previous_month_sales, 2
        ),

        "monthly_sales_change": monthly_sales_change,
        "monthly_sales_change_percent":
            monthly_sales_change_percent,

        "monthly_sales_trend": monthly_sales_trend
    }
