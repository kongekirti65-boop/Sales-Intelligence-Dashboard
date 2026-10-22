from flask import Flask, jsonify, request, send_from_directory
from analysis import load_sales_data, get_dashboard_data
import os

app = Flask(__name__)

# Find the project folders

# Find the project folders
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend floder")



# Login page
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


# Login page CSS
@app.route("/style.css")
def login_css():
    return send_from_directory(FRONTEND_DIR, "style.css")


# Dashboard page
@app.route("/dashboard")
def dashboard():
    return send_from_directory(
        FRONTEND_DIR,
        "dashboard.html"
    )


# Dashboard CSS
@app.route("/dashboard.css")
def dashboard_css():
    return send_from_directory(
        FRONTEND_DIR,
        "dashboard.css"
    )


# Dashboard JavaScript
@app.route("/dashboard.js")
def dashboard_js():
    return send_from_directory(
        FRONTEND_DIR,
        "dashboard.js"
    )


# Dashboard data API
@app.route("/api/dashboard")
def dashboard_api():
    try:
        # Load sales data
        df = load_sales_data()

        # Filter by category
        category = request.args.get(
            "category", "All"
        )

        if category != "All":
            if "Category" in df.columns:
                df = df[df["Category"] == category]

        # Filter by region
        region = request.args.get(
            "region", "All"
        )

        if region != "All":
            if "Region" in df.columns:
                df = df[df["Region"] == region]

        # Filter by start date
        start_date = request.args.get(
            "start_date", ""
        )

        if start_date and "Order Date" in df.columns:
            df = df[
                df["Order Date"]
                >= start_date
            ]

        # Filter by end date
        end_date = request.args.get(
            "end_date", ""
        )

        if end_date and "Order Date" in df.columns:
            df = df[
                df["Order Date"]
                < (
                    __import__("pandas").to_datetime(end_date)
                    + __import__("pandas").Timedelta(days=1)
                )
            ]

        # Calculate dashboard statistics
        data = get_dashboard_data(df)

        # Get available filter options
        original_df = load_sales_data()

        data["categories"] = (
            sorted(
                original_df["Category"]
                .dropna()
                .unique()
                .tolist()
            )
            if "Category" in original_df.columns
            else []
        )

        data["regions"] = (
            sorted(
                original_df["Region"]
                .dropna()
                .unique()
                .tolist()
            )
            if "Region" in original_df.columns
            else []
        )

        return jsonify(data)

    except Exception as error:
        app.logger.exception(
            "Error loading dashboard data"
        )

        return jsonify({
            "error": str(error)
        }), 500


# Start the Flask server
if __name__ == "__main__":
    app.run(debug=True)