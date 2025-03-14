from playwright.sync_api import sync_playwright
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Replace with your Spotify credentials
SPOTIFY_USERNAME = os.getenv("SPOTIFY_USERNAME")
SPOTIFY_PASSWORD = os.getenv("SPOTIFY_PASSWORD")
OUTPUT_DIR = "../backend/data"
OUTPUT_FILE = "weeklyTopAlbums.json"
BASE_URL = "https://charts.spotify.com"


def extract_data(page, country_name, data_key):
    """Extracts album details from the given country chart page."""
    
    tbody = page.locator("tbody")
    rows = tbody.locator("tr").all()[:25]  # Limit to first row for now

    albums = []

    for row in rows:
        third_td = row.locator("td").nth(2)  # Select the 3rd <td> element

        # Extract album Name
        first_div = third_td.locator("div").nth(0)  # Select the first <div> inside the 3rd <td>
        second_div = first_div.locator(":scope > div:nth-of-type(2)")  # Select the second direct child <div>
        
        # Navigate through the structure: <a> -> <div> -> <span> -> <span> -> <div> -> <span> for album name
        album_name_span = second_div.locator("a > div > span > span > div > span")
        album_name = album_name_span.inner_text() if album_name_span else None
        
        # Extract album URL (href of the <a> tag inside second_div)
        a_tag = second_div.locator("a").first
        album_url = a_tag.get_attribute("href") if a_tag else None
        
        # Extract Artist Names
        artist_div = second_div.locator("div > span > span > div > div > p")  # Navigate to the <p> tag
        artist_spans = artist_div.locator("span")  # Get all <span> inside <p>
        artist_names = ", ".join([span.locator("a").inner_text() for span in artist_spans.all()])  # Join artist names by commas

        # Extract Image URL
        img_div = first_div.locator(":scope > div:nth-of-type(1)")  # Select the first <div> for image
        img_tag = img_div.locator("img")  # Get the <img> tag inside img_div
        img_url = img_tag.get_attribute("src") if img_tag else None

        # Store extracted data
        albums.append({
            "country": country_name,
            "data_key": data_key,
            "album_name": album_name,
            "img_url": img_url,
            "album_url": album_url,
            "artist_name": artist_names
        })

    return albums

def save_to_json(data, filename):
    """Saves extracted data as a JSON file."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)  # Create data/ directory if not exists
    file_path = os.path.join(OUTPUT_DIR, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Data saved to {file_path}")

def login_to_spotify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)  # Slow mode for visibility
        context = browser.new_context()
        page = context.new_page()
        
        # Step 1: Open Spotify Charts
        print("Opening Spotify Charts...")
        page.goto(BASE_URL)
        page.wait_for_timeout(3000)

        # Step 2: Check for "Log in" button
        login_button = page.locator('a[data-testid="charts-login"]')
        
        if login_button.count() > 0:
            print("Login button found! Clicking it...")
            login_button.click()
            page.wait_for_timeout(10000)  # Wait for login page to load

            # Step 3: Enter Username & Password
            print("Entering credentials...")
            page.fill('input[data-testid="login-username"]', SPOTIFY_USERNAME)
            page.fill('input[data-testid="login-password"]', SPOTIFY_PASSWORD)

            # Step 4: Click the "Log In" button
            login_submit = page.locator('button[data-testid="login-button"]')
            if login_submit.count() > 0:
                print("Logging in...")
                login_submit.click()
                page.wait_for_timeout(5000)  # Wait for authentication

            else:
                print("Log In button not found!")
        else:
            print("Already logged in! Proceeding...")

        
        # Tile click

        # Locate the parent div with data-testid="overview-body"
        overview_body = page.locator('div[data-testid="overview-body"]')

        # Select the 3th div at the top level (index 2 because it's 0-based)
        weekly_top_albums = overview_body.locator(":scope > div").nth(2)


        # Check if the element exists before clicking
        if weekly_top_albums.count() > 0:
            print("Weekly Top Albums found! Clicking...")
            weekly_top_albums.click()
            page.wait_for_timeout(3000)  # Wait for the page to load
        else:
            print("Weekly Top Albumstile not found!")

        
        # step 7
        dropdown = page.locator("[data-testid='entity-picker-v2']")
        dropdown.click()

        # Wait for the dropdown to appear
        dropdown_list = dropdown.locator(":scope > div").nth(1)
        dropdown_list.wait_for(state="visible")

        # Locate all list items (li) inside the dropdown
        list_items = dropdown_list.locator("ul > li")

        all_albums = []  # Store all extracted albums

        # Open a new tab for each country and extract data
        for li in list_items.all():
        # for index in range(1):  # Limit to the first two items (index 0 and 1)
            # li = list_items.nth(index)
            data_key = li.get_attribute("data-key")  # Extract data-key
            country_name = li.locator("div > div").inner_text()  # Extract country name
            country_url = f"{BASE_URL}{data_key}"  # Construct full URL

            # Open a new tab in the same browser session
            new_tab = context.new_page()
            new_tab.goto(country_url)
            new_tab.wait_for_timeout(3000)

            # Extract albums details for this country
            albums = extract_data(new_tab, country_name, data_key)
            all_albums.extend(albums)

            new_tab.close()  # Close the tab after extracting data

        # # Print the extracted data
        # print(all_albums)

        # Save extracted data to a JSON file
        save_to_json(all_albums, OUTPUT_FILE)

        # Close browser after login
        print("Flow completed!")
        browser.close()

# Run the script
login_to_spotify()
