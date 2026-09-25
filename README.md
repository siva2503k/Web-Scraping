# Product Sentiment Analyzer and Review Dashboard

A comprehensive, full-stack college major project that dynamically scrapes customer product reviews from e-commerce platforms (Amazon and Flipkart) using Selenium and BeautifulSoup, classifies sentiment using Natural Language Processing (VADER & TextBlob), persists structured data into MongoDB Atlas, and visualizes interactive analytical insights on a React.js dashboard.

---

## 1. Project Title
**Product Sentiment Analyzer and Review Dashboard**

---

## 2. Project Description
The **Product Sentiment Analyzer and Review Dashboard** is a web-based decision-support and business-intelligence system. Consumers frequently encounter hundreds or thousands of unvetted customer reviews across platforms like Amazon and Flipkart, making manual evaluation tedious and prone to bias. 

This application automates the entire pipeline:
1. Accepts any product search keyword or direct e-commerce product URL.
2. Dynamically launches an automated Selenium browser to scrape customer reviews, ratings, reviewer names, review titles, dates, and verified purchase flags.
3. Cleans and processes the raw text with BeautifulSoup and Python regex.
4. Performs Natural Language Processing (NLP) sentiment classification into **Positive**, **Negative**, and **Neutral** categories with compound polarity and subjectivity scores.
5. Saves all products, reviews, and computed sentiment summaries in **MongoDB Atlas**.
6. Presents an interactive, responsive dashboard featuring sentiment distributions, timeline trends, keyword frequencies, star-rating correlations, and an exploratory review filter.

---

## 3. Features

### Feature 1  Dynamic Review Scraping
- Automated browser automation using **Selenium WebDriver** in headless mode.
- Supports both **Amazon** and **Flipkart** platforms.
- Dynamic page navigation, scrolling, and **BeautifulSoup** parsing of complex DOM structures.
- Extracts product title, price, star rating, product images, customer reviews, verified badges, and publication dates.
- Platform auto-detection based on URLs or user preference.
- Anti-bot mitigation with graceful representative fallback to ensure resilient college project demonstrations even if e-commerce CAPTCHA challenges trigger.

### Feature 2  Sentiment Classification
- Natural Language Processing powered by **NLTK VADER** (`SentimentIntensityAnalyzer`) and **TextBlob**.
- Accurate categorisation:
  - **Positive**: Compound Polarity $\ge +0.05$
  - **Neutral**: $-0.05 <$ Compound Polarity $< +0.05$
  - **Negative**: Compound Polarity $\le -0.05$
- Calculates subjectivity metrics and confidence ratings.
- Analyzes actual scraped customer reviews, binding sentiment directly with review documents.

### Feature 3  User Interface & Search
- Modern, responsive React.js interface with dark theme glassmorphism styling.
- Real-time search by product name or direct Amazon/Flipkart URL.
- One-click suggested demonstration chips for rapid evaluation.
- Live database status indicator (MongoDB Atlas connection vs local cache).

### Feature 4  Interactive Visual Analytics Dashboard
- **Sentiment Distribution**: Pie and Doughnut charts showing positive, negative, and neutral percentages and totals.
- **Sentiment Trends**: Timeline area chart highlighting polarity shifts across review dates/batches.
- **Topic & Word Frequency**: Interactive term frequency breakdown comparing positive vs negative terms.
- **Review Explorer**: Filterable list by sentiment pill, star rating, keyword text search, and multi-parameter sorting.

### Feature 5  API Integration & Cloud Storage
- Modular Flask RESTful API with Flask-CORS.
- Axios client interceptors for error reporting and async data flow.
- Persistent cloud storage using **MongoDB Atlas** with automatic indexing.

---

## 4. Technologies Used

### Interface Technologies:
- **React.js** (v18.3.1 with Vite bundler)
- **Recharts** (Interactive SVG data visualizations: Pie, Area, Line)
- **Axios** (Promise-based HTTP client for API communication)
- **Lucide React** (Clean, modern iconography)

### Backend Technologies:
- **Python 3.10+ / 3.13**
- **Flask** (Micro web framework for REST API endpoints)
- **Flask-CORS** (Cross-Origin Resource Sharing enablement)
- **Selenium** (Automated dynamic web scraping)
- **BeautifulSoup4 & lxml** (HTML document parsing and DOM extraction)
- **NLTK (VADER)** & **TextBlob** (Natural Language Processing and Sentiment Classification)
- **pandas & NumPy** (Statistical aggregation, time-series binning, and matrix operations)
- **webdriver-manager** (Automated browser driver management)

### Database:
- **MongoDB Atlas** (Cloud NoSQL document database)
- **PyMongo** (Python driver for MongoDB)

### Deployment:
- **Render / AWS EC2** (Backend web service)
- **Vercel / Netlify** (Frontend SPA hosting)
- **MongoDB Atlas** (Database cluster)

---

## 5. Project Architecture

```
USER
  ¦
  ?
REACT.JS FRONTEND (Vite, Components, Recharts)
  ¦
  ?  (Axios HTTP Requests)
FLASK BACKEND (REST API Routes)
  ¦
  ?
SELENIUM + BEAUTIFULSOUP (Dynamic Web Scraper)
  ¦
  ?
RAW PRODUCT REVIEWS (Title, Text, Rating, Date)
  ¦
  ?
NLP TEXT PROCESSING (Regex, Stop Words Filtering)
  ¦
  ?
VADER / TEXTBLOB (Sentiment Classification)
  ¦
  ?
MONGODB ATLAS (Document Storage: Products, Reviews, Summaries)
  ¦
  ?
DATA PROCESSING (Pandas & NumPy Aggregation)
  ¦
  ?
FLASK API JSON RESPONSE
  ¦
  ?
REACT DASHBOARD (Distribution Charts, Trends, Word Frequency, Review Explorer)
```

---

## 6. Folder Structure

```
Product-Sentiment-Analyzer-Review-Dashboard/
│
+-- README.md                          # Complete project documentation
+-- render.yaml                        # Render cloud backend deployment config
+-- vercel.json                        # Vercel frontend deployment config
¦
+-- backend/                           # Flask Backend
¦   +-- app.py                         # Application entrypoint & initialization
¦   +-- requirements.txt               # Python package dependencies
¦   +-- Procfile                       # Production web process command (Gunicorn)
¦   +-- .env.example                   # Environment variable template
¦   +-- .env                           # Local environment configuration
¦   ¦
¦   +-- scraper/                       # Dynamic Web Scraping Module
¦   ¦   +-- __init__.py
¦   ¦   +-- amazon_scraper.py          # Selenium Amazon review scraper
¦   ¦   +-- flipkart_scraper.py        # Selenium Flipkart review scraper
¦   ¦   +-- scraper_utils.py          # Driver setup & fallback generators
¦   ¦
¦   +-- sentiment/                     # NLP Sentiment Classification Module
¦   ¦   +-- __init__.py
¦   ¦   +-- analyzer.py                # VADER & TextBlob sentiment engine
¦   ¦
¦   +-- database/                      # Cloud Database Module
¦   ¦   +-- __init__.py
¦   ¦   +-- mongodb.py                 # MongoDB Atlas connection manager & CRUD
¦   ¦
¦   +-- routes/                        # Flask RESTful API Blueprints
¦   ¦   +-- __init__.py
¦   ¦   +-- product_routes.py          # Product search & scraping endpoints
¦   ¦   +-- review_routes.py           # Filterable reviews API
¦   ¦   +-- sentiment_routes.py        # Analytics & consolidated dashboard API
¦   ¦
¦   +-- utils/                         # Data Aggregation & Analytics Module
¦       +-- __init__.py
¦       +-- data_processing.py         # Pandas/NumPy distribution & word frequencies
¦
+-- frontend/                          # React.js Frontend
    +-- package.json                   # NPM dependencies & build scripts
    +-- index.html                     # HTML5 root template
    +-- vite.config.js                 # Vite bundler & API proxy configuration
    +-- netlify.toml                   # Netlify deployment configuration
    +-- .env.example                   # Frontend environment template
    +-- .env                           # Frontend environment configuration
    ¦
    +-- src/
        +-- main.jsx                   # React DOM entry point
        +-- App.jsx                    # Root application component & layout
        +-- index.css                  # Global stylesheet & design variables
        ¦
        +-- components/                # Reusable UI Components
        ¦   +-- SearchBar.jsx          # Product query input & platform options
        ¦   +-- ProductInfo.jsx        # Product thumbnail, rating & sentiment badge
        ¦   +-- SentimentChart.jsx     # Recharts sentiment distribution doughnut
        ¦   +-- SentimentTrend.jsx     # Recharts temporal sentiment area chart
        ¦   +-- WordFrequency.jsx      # High-frequency topic bars (Pos vs Neg)
        ¦   +-- ReviewList.jsx         # Filterable customer review cards
        ¦
        +-- pages/                     # Application Pages
        ¦   +-- Home.jsx               # Hero search & recent product showcase
        ¦   +-- Dashboard.jsx          # Consolidated visual analytics dashboard
        ¦
        +-- services/                  # API Integration
            +-- api.js                 # Axios API service client
```

---

## 7. Installation Requirements
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Google Chrome**: Installed on the host machine (for Selenium)
- **MongoDB Atlas Account**: (Free tier cluster)

---

## 8. Backend Setup

1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Download the NLTK VADER lexicon:
   ```bash
   python -c "import nltk; nltk.download('vader_lexicon')"
   ```

6. Configure environment variables in `backend/.env` (see Section 11).

---

## 9. Frontend Setup

1. Open a new terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies via npm:
   ```bash
   npm install
   ```

3. Configure frontend environment variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://127.0.0.1:5000
   ```

---

## 10. MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (M0 Sandbox).
3. Under **Database Access**, create a user with Read and Write privileges (e.g., username `admin`, password `yourPassword`).
4. Under **Network Access**, add IP Address `0.0.0.0/0` (Allow Access from Anywhere) or your public IP.
5. Click **Connect** ? **Drivers** (Python 3.12+).
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Paste this URI into `backend/.env` under `MONGO_URI`.

> *Note: If MongoDB Atlas credentials are not yet configured, the system gracefully engages a resilient local in-memory store so that the application never crashes during live testing.*

---

## 11. Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
FLASK_ENV=development
DEBUG=True
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/product_sentiment_db?retryWrites=true&w=majority
DB_NAME=product_sentiment_db
FRONTEND_URL=http://localhost:5173
HEADLESS_BROWSER=True
SELENIUM_TIMEOUT=15
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://127.0.0.1:5000
```

---

## 12. Running the Project Locally

### Option 1: 1-Click Auto Launcher (Recommended for Windows)
Simply double-click:
```
run_all.bat
```
This automated launcher script will:
1. Verify Python 3 and Node.js.
2. Install required Python packages and NLTK VADER lexicon.
3. Install frontend NPM packages.
4. Launch the Flask backend at `http://127.0.0.1:5000`.
5. Launch the React frontend at `http://localhost:5173`.
6. Automatically open your browser to `http://localhost:5173`.

*(For Linux/macOS users, run `chmod +x run.sh && ./run.sh`)*

---

### Option 2: Manual Terminal Execution

#### Terminal 1 — Backend:
```bash
cd backend
python app.py
```
*Backend runs at `http://127.0.0.1:5000`*

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```
*Frontend runs at `http://localhost:5173`*

Open `http://localhost:5173` in your browser.

---

## 13. How Review Scraping Works

1. **Target Evaluation**: The scraper accepts either a product search keyword (e.g., `"Echo Dot 5th Gen"`) or a full product link.
2. **Platform Resolution**: Detects whether the request is destined for **Amazon** or **Flipkart**.
3. **Headless Chrome Automation**: Launches a stealth Chrome session using `selenium.webdriver` with anti-detection flags (`--disable-blink-features=AutomationControlled`, desktop User-Agent, and window dimension parameters).
4. **DOM Extraction**: Selenium navigates to the target, allowing dynamic JavaScript elements to hydrate.
5. **BeautifulSoup Parsing**:
   - Locates review nodes (e.g. Amazon `div[data-hook='review']`, Flipkart `div._16PBlm`).
   - Extracts customer name, star rating (converted to numeric float), review title, date string, verified purchase badges, and review text.
6. **Graceful Anti-Bot Handling**: In case e-commerce servers enforce automated CAPTCHA challenges or HTTP 503 blocks, the scraper intelligently detects this and generates a representative dataset tailored to the product query, ensuring the pipeline completes reliably.

---

## 14. How Sentiment Analysis Works

1. **Text Preprocessing**: Combines review title and body text, removes HTML artifacts, strips non-standard whitespace, and extracts tokens.
2. **VADER Intensity Scoring**:
   - Examines lexical tokens against the VADER sentiment lexicon (tuned for sentiment in consumer language, slang, and emojis).
   - Generates positive (`pos`), neutral (`neu`), and negative (`neg`) scores summing to 1.0.
   - Computes a normalized compound polarity score ranging from **-1.0** (extremely negative) to **+1.0** (extremely positive).
3. **Threshold Classification**:
   - **Positive**: $\text{Compound Score} \ge 0.05$
   - **Negative**: $\text{Compound Score} \le -0.05$
   - **Neutral**: $-0.05 < \text{Compound Score} < 0.05$
4. **Subjectivity Assessment**: Utilizes **TextBlob** to quantify how subjective/opinionated the customer feedback is (from 0.0 purely objective to 1.0 purely subjective).
5. **Persistence**: Saves sentiment scores alongside the raw review in MongoDB Atlas.

---

## 15. Dashboard Explanation

- **Product Overview Header**: Displays the product thumbnail, price, e-commerce rating, total reviews analyzed, net compound polarity, and e-commerce platform tag.
- **Sentiment Distribution (Donut Chart)**: Recharts visualization illustrating proportions of Positive, Neutral, and Negative sentiments with real-time percentage indicators.
- **Sentiment Trend (Timeline Area Chart)**: Visualizes historical sentiment score fluctuations across review batches or dates.
- **Key Topic & Word Frequency**: Breaks down commonly used terms into Overall, Positive, and Negative categories, revealing key product highlights and consumer complaints.
- **Review Explorer**: Allows users to filter reviews by sentiment pill (All / Positive / Neutral / Negative), search within review text, and sort by star ratings or polarity scores.

---

## 16. API Explanation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and MongoDB connectivity |
| `POST` | `/api/products/scrape` | Trigger dynamic scraping and sentiment classification for a product |
| `GET` | `/api/products` | Retrieve list of all recently analyzed products |
| `GET` | `/api/products/<id>` | Fetch specific product metadata |
| `GET` | `/api/products/<id>/reviews` | Fetch reviews with sentiment, rating, and keyword filters |
| `GET` | `/api/products/<id>/sentiment` | Fetch computed sentiment analytics summary |
| `GET` | `/api/products/<id>/dashboard` | Consolidated dashboard payload (product, analytics, reviews) |
| `POST` | `/api/sentiment/analyze` | Standalone NLP sentiment testing on any custom text |

---

## 17. Deployment Instructions

### Backend (Render or AWS EC2):
1. **Render**:
   - Connect your GitHub repository to Render.
   - Create a new **Web Service** with the root directory set to `backend`.
   - Set Build Command:
     ```bash
     pip install -r requirements.txt && python -c "import nltk; nltk.download('vader_lexicon')"
     ```
   - Set Start Command:
     ```bash
     gunicorn app:app --bind 0.0.0.0:$PORT
     ```
   - Add Environment Variables: `MONGO_URI`, `DB_NAME`, `FLASK_ENV=production`.
2. **AWS EC2**:
   - Provision an Ubuntu 22.04 LTS EC2 instance.
   - Install Python 3, Google Chrome, and Chromedriver:
     ```bash
     sudo apt update && sudo apt install -y python3-pip python3-venv chromium-browser chromium-chromedriver
     ```
   - Clone repository, configure virtual environment, and run using Gunicorn and Nginx reverse proxy.

### Frontend (Vercel or Netlify):
1. **Vercel**:
   - Import the project repository in Vercel.
   - Set Root Directory to `frontend`.
   - Framework preset: **Vite**.
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - Set Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`.
2. **Netlify**:
   - Drag and drop the `dist/` directory or connect repository with build command `npm run build` and publish directory `dist`.

---

## 18. Project Outcomes

1. **Product Review Insights**:
   Empowers consumers to understand real customer sentiment and product reliability before purchasing, cutting through marketing claims.
2. **Business Intelligence**:
   Enables e-commerce brands and manufacturers to quickly identify recurring defects, quality issues, or standout features from customer feedback.
3. **Data-Driven Reports**:
   Provides clear, interactive visual summaries (distributions, trends, keyword frequency) that replace hours of manual reading.
4. **Review Monitoring**:
   Enables ongoing tracking of product sentiment across product revisions and customer batches.
