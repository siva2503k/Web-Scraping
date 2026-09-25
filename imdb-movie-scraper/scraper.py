"""
IMDb Movie Rating Scraper Module
Automates the retrieval of IMDb Top 250 movies using Selenium and Chrome WebDriver.
"""

import os
import re
import time
import shutil
import logging
import threading
from typing import List, Dict, Any, Optional, Callable

import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

IMDB_TOP_250_URL = "https://www.imdb.com/chart/top/"
DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DEFAULT_CSV_PATH = os.path.join(DEFAULT_DATA_DIR, "movies.csv")


def find_chrome_binary() -> Optional[str]:
    """Find the path to the Chrome executable across standard locations."""
    standard_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in standard_paths:
        if os.path.isfile(path):
            return path

    which_chrome = shutil.which("chrome") or shutil.which("google-chrome")
    if which_chrome:
        return which_chrome

    return None


class IMDbScraper:
    """
    Automates scraping the IMDb Top 250 movies chart using Selenium and Chrome WebDriver.
    Provides anti-bot stealth mechanisms, headless toggling, progress reporting, and CSV persistence.
    """

    def __init__(self, data_file: str = DEFAULT_CSV_PATH):
        self.data_file = data_file
        self.driver: Optional[webdriver.Chrome] = None
        self._abort_flag = threading.Event()
        self._lock = threading.Lock()
        self.is_running = False

        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)

    def stop(self):
        """Signal the running scraper to gracefully halt."""
        logger.info("Scraper stop requested by user.")
        self._abort_flag.set()
        with self._lock:
            if self.driver:
                try:
                    self.driver.quit()
                except Exception as e:
                    logger.warning(f"Error while quitting driver on stop: {e}")
                finally:
                    self.driver = None

    def _build_chrome_options(self, headless: bool = True) -> Options:
        """Configure Chrome with stealth flags to prevent detection and enhance performance."""
        options = Options()

        chrome_bin = find_chrome_binary()
        if chrome_bin:
            options.binary_location = chrome_bin

        if headless:
            options.add_argument("--headless=new")

        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--lang=en-US,en")
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )

        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        prefs = {
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False,
        }
        options.add_experimental_option("prefs", prefs)

        return options

    def _init_driver(self, headless: bool = True) -> webdriver.Chrome:
        """Initialize Chrome WebDriver with fallback strategies."""
        options = self._build_chrome_options(headless=headless)

        try:
            driver = webdriver.Chrome(options=options)
        except Exception as err1:
            logger.warning(f"Default Selenium Manager failed: {err1}. Trying webdriver-manager...")
            try:
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
            except Exception as err2:
                logger.error(f"webdriver-manager also failed: {err2}")
                raise RuntimeError(
                    f"Could not launch Chrome WebDriver. Ensure Google Chrome is installed. Details: {err2}"
                )

        try:
            driver.execute_cdp_cmd(
                "Page.addScriptToEvaluateOnNewDocument",
                {
                    "source": """
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        });
                    """
                },
            )
        except Exception as e:
            logger.warning(f"Could not apply CDP stealth patch: {e}")

        driver.set_page_load_timeout(45)
        return driver

    def _parse_item(self, item, idx: int) -> Dict[str, Any]:
        """Parse a single IMDb Top 250 list element with multiple fallback strategies."""
        item_text = item.get_text("\n", strip=True)
        lines = [line.strip() for line in item_text.split("\n") if line.strip()]

        # 1. Title
        title = ""
        link_elem = item.select_one("a.ipc-title-link-wrapper, a[href*='/title/tt']")
        title_elem = item.select_one("h3.ipc-title__text, .ipc-title-link-wrapper h3")
        
        if link_elem and link_elem.get_text(strip=True):
            raw_title = link_elem.get_text(strip=True)
            # Remove leading rank number like "1. " or "#1"
            title = re.sub(r"^#?\d+[\.\s\-]+\s*", "", raw_title).strip()
        elif title_elem and title_elem.get_text(strip=True):
            raw_title = title_elem.get_text(strip=True)
            title = re.sub(r"^#?\d+[\.\s\-]+\s*", "", raw_title).strip()
        
        if not title and len(lines) >= 2:
            # First line is often "#1", second line is Title
            cand = lines[1] if lines[0].startswith("#") or lines[0].isdigit() else lines[0]
            title = re.sub(r"^#?\d+[\.\s\-]+\s*", "", cand).strip()

        # 2. Ranking
        rank = idx
        for token in lines[:3]:
            m = re.match(r"^#?(\d+)$", token)
            if m:
                rank = int(m.group(1))
                break

        # 3. Metadata (Year, Duration, Certificate)
        year = "N/A"
        duration = "N/A"
        certificate = "Not Rated"

        # Search for year: 4-digit number (1920-2029)
        for token in lines:
            if year == "N/A" and re.match(r"^(19\d\d|20[0-3]\d)$", token):
                year = token
            elif duration == "N/A" and re.match(r"^(\d+h(\s*\d+m)?|\d+m)$", token):
                duration = token
            elif certificate == "Not Rated" and token in [
                "G", "PG", "PG-13", "R", "NC-17", "TV-MA", "TV-14", "Passed", "Approved", "Unrated", "16+", "18+"
            ]:
                certificate = token

        # 4. IMDb Rating
        rating = 0.0
        rating_elem = item.select_one(".ipc-rating-star--rating, [data-testid='ratingGroup--imdb-rating'] span")
        if rating_elem:
            try:
                rating = float(rating_elem.get_text(strip=True))
            except ValueError:
                rating = 0.0
        
        if rating == 0.0:
            # Search in lines for float rating (e.g. 8.0 to 9.9)
            for token in lines:
                m = re.match(r"^([789]\.\d)$", token)
                if m:
                    rating = float(m.group(1))
                    break

        # 5. Vote Count
        votes = ""
        votes_elem = item.select_one(".ipc-rating-star--voteCount")
        if votes_elem:
            raw_v = votes_elem.get_text(strip=True)
            votes = re.sub(r"[()]", "", raw_v).strip()
        
        if not votes:
            for token in lines:
                m = re.match(r"^([\d\.]+[KMBkmb])$", token)
                if m:
                    votes = m.group(1).upper()
                    break

        # 6. IMDb URL
        imdb_url = ""
        if link_elem and link_elem.has_attr("href"):
            href = link_elem["href"].split("?")[0]
            imdb_url = f"https://www.imdb.com{href}"

        # 7. Poster Image URL
        poster_url = ""
        img_elem = item.select_one("img.ipc-image, img")
        if img_elem:
            poster_url = img_elem.get("src") or img_elem.get("data-src") or ""

        return {
            "rank": rank,
            "title": title or f"Top Movie #{rank}",
            "year": year,
            "rating": rating,
            "votes": votes,
            "duration": duration,
            "certificate": certificate,
            "imdb_url": imdb_url,
            "poster_url": poster_url,
        }

    def scrape_top_250(
        self,
        headless: bool = True,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Scrape all 250 movies from IMDb Top 250.
        
        Args:
            headless: Whether to run Chrome without a visible window.
            progress_callback: Optional function (current, total, status_message) for UI updates.
            
        Returns:
            List of movie dictionaries.
        """
        self._abort_flag.clear()
        self.is_running = True
        movies: List[Dict[str, Any]] = []

        def notify(current: int, total: int, msg: str):
            if progress_callback:
                try:
                    progress_callback(current, total, msg)
                except Exception as cb_err:
                    logger.warning(f"Error in progress callback: {cb_err}")

        try:
            notify(0, 250, "Initializing Chrome WebDriver...")
            with self._lock:
                if self._abort_flag.is_set():
                    notify(0, 250, "Scrape cancelled.")
                    return []
                self.driver = self._init_driver(headless=headless)

            if self._abort_flag.is_set():
                notify(0, 250, "Scrape cancelled.")
                return []

            notify(5, 250, f"Loading IMDb Top 250 page ({'Headless' if headless else 'Visible'} Mode)...")
            self.driver.get(IMDB_TOP_250_URL)

            # Wait for content or detect human challenge
            notify(15, 250, "Waiting for dynamic content to render...")
            try:
                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "li.ipc-metadata-list-summary-item"))
                )
            except TimeoutException:
                title = self.driver.title
                if "Human Verification" in title or "Robot Check" in title:
                    raise RuntimeError("IMDb presented a human verification challenge. Please try again or switch headless mode.")
                raise RuntimeError(f"Timed out waiting for IMDb Top 250 list to load. Page title: '{title}'")

            # Brief pause for hydration
            time.sleep(1.5)

            if self._abort_flag.is_set():
                notify(0, 250, "Scrape cancelled.")
                return []

            notify(30, 250, "Parsing HTML and extracting movie metadata...")
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, "html.parser")

            items = soup.find_all("li", class_="ipc-metadata-list-summary-item")
            if not items:
                raise RuntimeError("No movie items found on the IMDb page.")

            total_items = len(items)
            logger.info(f"Found {total_items} items on IMDb Top 250 page.")

            for idx, item in enumerate(items, start=1):
                if self._abort_flag.is_set():
                    notify(len(movies), 250, f"Scrape stopped by user at {len(movies)} movies.")
                    break

                movie_data = self._parse_item(item, idx)
                movies.append(movie_data)

                # Report incremental progress every 15 items or at milestones
                if idx % 15 == 0 or idx == total_items:
                    notify(idx, total_items, f"Extracted {idx}/{total_items} movies ({movie_data['title'][:25]}...)")
                    time.sleep(0.01)

            if movies and not self._abort_flag.is_set():
                notify(total_items, total_items, "Saving extracted movies to CSV...")
                self.save_to_csv(movies)
                notify(total_items, total_items, f"Successfully scraped and cached all {len(movies)} movies!")

            return movies

        except Exception as exc:
            logger.error(f"Error during IMDb scrape: {exc}", exc_info=True)
            notify(len(movies), 250, f"Error: {str(exc)}")
            raise exc

        finally:
            self.is_running = False
            with self._lock:
                if self.driver:
                    try:
                        self.driver.quit()
                    except Exception as q_err:
                        logger.warning(f"Error closing driver in finally: {q_err}")
                    finally:
                        self.driver = None

    def save_to_csv(self, movies: List[Dict[str, Any]], filepath: Optional[str] = None) -> str:
        """Save movie records to CSV file using pandas."""
        target_path = filepath or self.data_file
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        df = pd.DataFrame(movies)
        df.to_csv(target_path, index=False, encoding="utf-8")
        logger.info(f"Saved {len(movies)} movies to {target_path}")
        return target_path

    def load_from_csv(self, filepath: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load movie records from CSV file."""
        target_path = filepath or self.data_file
        if not os.path.exists(target_path):
            return []

        try:
            df = pd.read_csv(target_path, encoding="utf-8")
            df = df.fillna("")
            if "rank" in df.columns:
                df["rank"] = pd.to_numeric(df["rank"], errors="coerce").fillna(0).astype(int)
            if "rating" in df.columns:
                df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0.0).astype(float)
            return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Error loading CSV from {target_path}: {e}")
            return []

    def get_summary_stats(self, movies: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Compute dashboard statistics from movie list."""
        movie_list = movies if movies is not None else self.load_from_csv()
        if not movie_list:
            return {
                "total_movies": 0,
                "avg_rating": 0.0,
                "highest_rated": "N/A",
                "highest_rating": 0.0,
                "lowest_rated": "N/A",
                "lowest_rating": 0.0,
                "latest_year": "N/A",
                "oldest_year": "N/A",
            }

        ratings = [m["rating"] for m in movie_list if isinstance(m.get("rating"), (int, float)) and m["rating"] > 0]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

        highest_movie = max(movie_list, key=lambda m: m.get("rating", 0.0))
        lowest_movie = min(movie_list, key=lambda m: m.get("rating", 10.0))

        valid_years = []
        for m in movie_list:
            yr_str = str(m.get("year", ""))
            match = re.search(r"\b(19\d\d|20\d\d)\b", yr_str)
            if match:
                valid_years.append(int(match.group(1)))

        latest_year = max(valid_years) if valid_years else "N/A"
        oldest_year = min(valid_years) if valid_years else "N/A"

        return {
            "total_movies": len(movie_list),
            "avg_rating": avg_rating,
            "highest_rated": highest_movie.get("title", "N/A"),
            "highest_rating": highest_movie.get("rating", 0.0),
            "lowest_rated": lowest_movie.get("title", "N/A"),
            "lowest_rating": lowest_movie.get("rating", 0.0),
            "latest_year": latest_year,
            "oldest_year": oldest_year,
        }
