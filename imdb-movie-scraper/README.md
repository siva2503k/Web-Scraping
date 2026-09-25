# 🎬 IMDb Movie Rating Scraper & Analytics Dashboard

An interactive, portfolio-grade Python web application that dynamically scrapes and analyzes the **IMDb Top 250 Movies** using **Selenium**, **Chrome WebDriver**, **pandas**, and **Flask**. Features a dark cinematic UI inspired by IMDb, real-time scraping controls, statistics, interactive data visualizations (Chart.js), responsive data tables with search/sorting/pagination, detailed movie modals, and one-click CSV export.

---

## 🌟 Key Features

### 1. 🚀 Dynamic Scraper Automation
- **Selenium + Chrome WebDriver**: Automates browser navigation and dynamic DOM rendering on `https://www.imdb.com/chart/top/`.
- **Anti-Bot Stealth Engine**: Employs Chrome DevTools Protocol (`Page.addScriptToEvaluateOnNewDocument`), custom user-agent headers, and `--disable-blink-features=AutomationControlled` to evade bot verification blocks.
- **Headless Mode Toggle**: Seamlessly switch between **Headless ON** (background silent execution) and **Headless OFF** (visible browser automation).
- **Graceful Cancellation**: Real-time "Stop Scraping" button cleanly terminates active browser sessions.

### 2. 📊 Live Statistics & Summary Cards
- **Total Movies Scraped**: Instant count of loaded entries.
- **Average IMDb Rating**: Dynamically calculated across all ranked titles.
- **Highest-Rated Movie**: Top-rated title and IMDb score (e.g. *The Shawshank Redemption - 9.3*).
- **Lowest-Rated Movie**: Threshold rating at rank #250.
- **Release Year Range**: Spans the earliest classic (1917) to contemporary cinema.

### 3. 📈 Interactive Visualizations (Chart.js)
- **Rating Distribution**: Histogram showing movie distribution across rating brackets (8.0 to 9.3).
- **Movies by Era / Decade**: Line/area trend showcasing golden cinematic eras (1920s through 2020s).
- **Top 10 Hall of Fame**: Horizontal bar chart comparing scores of the top 10 highest-ranked films.

### 4. 📋 Advanced Movie Data Table
- **Search Filter**: Instant real-time search across movie titles and release years.
- **Quick Preset Chips**: Fast filters for *All*, *9.0+ Masters*, *2000s & Newer*, and *Classics (<1980)*.
- **Multi-Column Sorting**: Sort by Rank, Title, Release Year, or IMDb Rating.
- **Client-Side Pagination**: Configurable rows per page (10, 25, 50, 100, or All).
- **Rich Media**: High-res thumbnail posters, rank badges (special gold styling for Top 3), runtime, certificate badges, and star ratings.

### 5. 🔍 Movie Details Modal
- Click any movie title or info icon to launch an overlay displaying high-resolution poster artwork, official ranking, duration, age rating certificate, IMDb score, voter count, and direct link to the IMDb title page.

### 6. 📥 CSV Export & Persistent Caching
- **One-Click CSV Export**: Download the complete dataset as `imdb_top_250_movies.csv`.
- **Automatic Caching**: Scraped data is cached in `data/movies.csv` using pandas, allowing the dashboard to operate offline or retain data across server restarts.

---

## 🛠️ Technologies & Stack

- **Backend**: Python 3.10+, Flask 3.x
- **Browser Automation**: Selenium 4.x, Chrome WebDriver, `webdriver-manager`
- **Data Science & Processing**: pandas, NumPy, BeautifulSoup4
- **Frontend**: HTML5, CSS3 (Modern Dark Cinematic Theme), Vanilla JavaScript (ES6+)
- **Charts & Icons**: Chart.js 4.x (CDN), FontAwesome 6 (CDN), Google Fonts (*Inter* & *Outfit*)

---

## 📂 Project Structure

```text
imdb-movie-scraper/
│
├── app.py                  # Flask web server, background threading, and REST API
├── scraper.py              # Selenium IMDb scraping engine with stealth & parsing logic
├── requirements.txt        # Pinned Python package dependencies
├── README.md               # Complete project documentation
├── .gitignore              # Ignored files (venv, pycache, temporary files)
│
├── data/
│   └── movies.csv          # Cached movie dataset (scraped via pandas)
│
├── templates/
│   └── index.html          # Semantic HTML5 dashboard template
│
└── static/
    ├── css/
    │   └── style.css       # Cinematic dark theme styling & responsive layout
    └── js/
        └── script.js       # AJAX polling, controls, table logic & Chart.js integration
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Python 3.10 or higher** installed on your system.
- **Google Chrome** browser installed.

### 2. Clone or Extract the Project
Navigate into the project directory:
```bash
cd imdb-movie-scraper
```

### 3. Create a Virtual Environment (Recommended)
On **Windows (PowerShell)**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On **macOS / Linux**:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 4. Install Dependencies
Install all required packages from `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## 🚀 How to Run the Application

Start the Flask development server:
```bash
python app.py
```

Once running, open your web browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 🔍 How Selenium and ChromeDriver Work

1. **Driver Initialization**:
   `scraper.py` attempts to use Selenium 4's native Selenium Manager to match your installed Google Chrome version automatically. If needed, it falls back to `webdriver-manager` to ensure the correct ChromeDriver binary is fetched.
2. **Stealth Configuration**:
   Automated browsers normally declare `navigator.webdriver = true` and include Chrome automation flags. The scraper disables `AutomationControlled` and executes a Chrome DevTools Protocol (CDP) script on page load to mask automation signals, ensuring IMDb serves the chart rather than a bot challenge.
3. **Dynamic Page Rendering & Explicit Waits**:
   Selenium navigates to `https://www.imdb.com/chart/top/` and uses `WebDriverWait` to wait for the movie items (`li.ipc-metadata-list-summary-item`) to render in the DOM.
4. **Structured Parsing**:
   Once rendered, the page source is parsed using BeautifulSoup to extract:
   - Ranking (`rank`)
   - Title (`title`)
   - Release Year (`year`)
   - IMDb Rating (`rating`)
   - Total Votes (`votes`)
   - Runtime Duration (`duration`)
   - Age Certificate (`certificate`)
   - IMDb Link (`imdb_url`)
   - Poster Artwork URL (`poster_url`)
5. **Data Export**:
   Data is transformed into a pandas `DataFrame` and saved to `data/movies.csv`.

---

## 📖 How to Use the Web Application

1. **Viewing Cached Data**:
   The application preloads previously scraped data from `data/movies.csv` upon launch.
2. **Running a Live Scrape**:
   - In the **Scraper Controls** card, toggle **Headless Mode** `ON` (default) or `OFF` if you want to watch the Chrome window open.
   - Click **"Start Scraping"**.
   - Monitor the progress bar and status messages in real-time.
   - Once completed, the dashboard cards, charts, and table refresh automatically.
3. **Stopping a Scrape**:
   - While scraping is active, click **"Stop Scraping"**. The browser closes gracefully and saves movies extracted up to that moment.
4. **Searching & Filtering**:
   - Type in the search box to filter by movie name or year.
   - Click chips like `9.0+ Masters` or `2000s & Newer` for quick sub-views.
   - Click column headers (Rank, Title, Year, Rating) to sort.
5. **Exporting CSV**:
   - Click either **"Download CSV"** button (hero header or table header) to download `imdb_top_250_movies.csv`.

---

## 🔌 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Main Dashboard Interface |
| `/api/scrape` | `POST` | Start background scraper task (`{"headless": true/false}`) |
| `/api/scrape/status` | `GET` | Query live progress, percentage, status message |
| `/api/scrape/stop` | `POST` | Terminate running scraper |
| `/api/movies` | `GET` | Get all movies and summary statistics as JSON |
| `/api/download` | `GET` | Download CSV dataset file |

---

## ❓ Troubleshooting

- **Chrome Binary Not Found**:
  Make sure Google Chrome is installed in its default location. The scraper automatically inspects standard 64-bit and 32-bit Program Files and LocalAppData directories.
- **IMDb Human Verification / Bot Block**:
  If IMDb triggers a rate limit or CAPTCHA, toggle **Headless Mode OFF** and retry, or wait a few moments. The scraper includes built-in anti-bot headers and CDP masks to minimize this.
- **Port 5000 Already in Use**:
  Run `python app.py` and modify the port inside `app.run(..., port=5050)` if another service is bound to port 5000.
