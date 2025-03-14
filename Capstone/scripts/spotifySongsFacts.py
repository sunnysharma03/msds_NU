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
OUTPUT_FILE = "dailySongsFacts.json"
BASE_URL = "https://charts.spotify.com"


def extract_country_facts(page, country_name, data_key):
    """Extracts highlighted facts details from the carousel."""
    
    factArr = []
    seen_factArr= set()
    
    # Locate the main carousel div
    carousel = page.locator("div.alice-carousel")
    
    # Navigate inside the carousel to find the first ul
    ul_element = carousel.locator("div > div > ul").nth(0)
    
    # Get all li elements
    li_elements = ul_element.locator("li").all()
    
    for li in li_elements:
        # Navigate inside each li to find required divs
        nested_divs = li.locator("div > div").all()
        
        if len(nested_divs) < 2:
            continue  # Skip if the required structure is not found
        
        second_div = nested_divs[1]  # Select the second div
        
        # Extract image URL
        img_tag = second_div.locator("img")
        img_url = img_tag.get_attribute("src") if img_tag else None

        # Extract fact text by navigating inside the div structure
        first_inner_div = second_div.locator("div").nth(0)  # First inner div
        first_inner_div1 = first_inner_div.locator("div").nth(0) # next inner div
        fact = first_inner_div1.inner_text().strip() if first_inner_div else None

        # Extract date by navigating inside the second inner div and finding the first <a>
        second_inner_div = first_inner_div.locator("div").nth(1)  # Second inner div
        date_element = second_inner_div.locator("a").first
        dates = date_element.inner_text().strip() if date_element else None
        
        fact_tuple = (fact, dates, img_url)

        if fact_tuple not in seen_factArr:
            seen_factArr.add(fact_tuple)
            factArr.append({
                "country": country_name,
                "data_key": data_key,
                "fact": fact,
                "dates": dates,
                "img_url": img_url
            })
    
    return factArr

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

        
        # step 7
        dropdown = page.locator("[data-testid='entity-picker-v2']")
        dropdown.click()

        # Wait for the dropdown to appear
        dropdown_list = dropdown.locator(":scope > div").nth(1)
        dropdown_list.wait_for(state="visible")

        # Locate all list items (li) inside the dropdown
        list_items = dropdown_list.locator("ul > li")

        all_facts = []  # Store all extracted facts

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

            # Extract facts details for this country
            facts = extract_country_facts(new_tab, country_name, data_key)
            all_facts.extend(facts)

            new_tab.close()  # Close the tab after extracting data


        # Save extracted data to a JSON file
        save_to_json(all_facts, OUTPUT_FILE)

        # Close browser after login
        print("Flow completed!")
        browser.close()

# Run the script
login_to_spotify()
