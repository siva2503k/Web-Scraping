"""
Flask Web Application for IMDb Movie Rating Scraper.
Serves interactive dashboard, provides REST API endpoints for scraping control,
data inspection, statistics calculation, and CSV export.
"""

import os
import time
import threading
from datetime import datetime
from flask import Flask, render_template, jsonify, request, send_file, Response
from scraper import IMDbScraper, DEFAULT_CSV_PATH

app = Flask(__name__)

# Initialize Scraper
scraper = IMDbScraper()

# Thread-safe global scraping state
scrape_lock = threading.Lock()
scrape_state = {
    "is_running": False,
    "progress": 0,
    "total": 250,
    "percent": 0,
    "status_message": "Ready to scrape",
    "error": None,
    "start_time": None,
    "last_completed": None,
    "scraped_count": 0,
    "headless": True,
}


def background_scrape_worker(headless: bool = True):
    """Background task executed in a separate daemon thread."""
    global scrape_state

    def progress_callback(current: int, total: int, msg: str):
        with scrape_lock:
            scrape_state["progress"] = current
            scrape_state["total"] = total
            scrape_state["percent"] = int((current / total) * 100) if total > 0 else 0
            scrape_state["status_message"] = msg
            scrape_state["scraped_count"] = current

    try:
        with scrape_lock:
            scrape_state["is_running"] = True
            scrape_state["error"] = None
            scrape_state["progress"] = 0
            scrape_state["percent"] = 0
            scrape_state["status_message"] = "Initializing scraper engine..."
            scrape_state["start_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            scrape_state["headless"] = headless

        movies = scraper.scrape_top_250(headless=headless, progress_callback=progress_callback)

        with scrape_lock:
            scrape_state["is_running"] = False
            scrape_state["progress"] = len(movies)
            scrape_state["percent"] = 100 if len(movies) >= 250 else int((len(movies)/250)*100)
            scrape_state["last_completed"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            scrape_state["scraped_count"] = len(movies)
            if scraper._abort_flag.is_set():
                scrape_state["status_message"] = f"Scraping stopped by user. {len(movies)} movies saved."
            else:
                scrape_state["status_message"] = f"Successfully completed! {len(movies)} movies scraped and saved."

    except Exception as exc:
        with scrape_lock:
            scrape_state["is_running"] = False
            scrape_state["error"] = str(exc)
            scrape_state["status_message"] = f"Scraping failed: {str(exc)}"


@app.route("/")
def index():
    """Render main dashboard view."""
    return render_template("index.html")


@app.route("/scrape", methods=["POST"])
@app.route("/api/scrape", methods=["POST"])
def start_scrape():
    """Initiate dynamic IMDb scraping in the background."""
    with scrape_lock:
        if scrape_state["is_running"]:
            return jsonify({
                "status": "warning",
                "message": "Scraping task is already running in the background.",
                "state": scrape_state
            }), 409

    data = request.get_json(silent=True) or {}
    headless = data.get("headless", True)

    thread = threading.Thread(target=background_scrape_worker, args=(headless,), daemon=True)
    thread.start()

    return jsonify({
        "status": "success",
        "message": "Scraper initiated successfully.",
        "headless": headless
    })


@app.route("/scrape/stop", methods=["POST"])
@app.route("/api/scrape/stop", methods=["POST"])
def stop_scrape():
    """Cancel currently running scraping operation."""
    with scrape_lock:
        if not scrape_state["is_running"]:
            return jsonify({
                "status": "info",
                "message": "No active scraping process is currently running."
            })

    scraper.stop()
    return jsonify({
        "status": "success",
        "message": "Stop signal transmitted to scraper."
    })


@app.route("/scrape/status", methods=["GET"])
@app.route("/api/scrape/status", methods=["GET"])
def scrape_status():
    """Query live scraping progress and system status."""
    with scrape_lock:
        state_copy = dict(scrape_state)
    return jsonify(state_copy)


@app.route("/movies", methods=["GET"])
@app.route("/api/movies", methods=["GET"])
def get_movies():
    """Retrieve movies list and dashboard statistics."""
    movies = scraper.load_from_csv()
    stats = scraper.get_summary_stats(movies)

    # File modification time for cache indicator
    last_modified = None
    if os.path.exists(scraper.data_file):
        mtime = os.path.getmtime(scraper.data_file)
        last_modified = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")

    return jsonify({
        "status": "success",
        "count": len(movies),
        "last_updated": last_modified or scrape_state["last_completed"],
        "stats": stats,
        "movies": movies
    })


@app.route("/download", methods=["GET"])
@app.route("/api/download", methods=["GET"])
def download_csv():
    """Export and download movies CSV dataset."""
    if not os.path.exists(scraper.data_file) or os.path.getsize(scraper.data_file) == 0:
        return jsonify({
            "status": "error",
            "message": "No movie data available yet. Please run the scraper first."
        }), 404

    return send_file(
        scraper.data_file,
        mimetype="text/csv",
        as_attachment=True,
        download_name="imdb_top_250_movies.csv"
    )


if __name__ == "__main__":
    print("Starting IMDb Movie Scraper Web Application on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
