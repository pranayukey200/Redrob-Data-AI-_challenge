"""
Capture screenshots from the deployed website
"""
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def capture_website_screenshots():
    url = "https://intellisense-2253d.web.app/"
    output_dir = Path("output/visuals")
    output_dir.mkdir(exist_ok=True)

    # Setup headless Chrome
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)

        # Wait for page to load
        time.sleep(3)

        # Capture full page
        driver.save_screenshot(str(output_dir / "website_landing.png"))
        print(f"✓ Captured landing page")

        # Scroll to features section if exists
        try:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
            driver.save_screenshot(str(output_dir / "website_features.png"))
            print(f"✓ Captured features section")
        except:
            pass

        # Scroll to results/demo section
        try:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
            driver.save_screenshot(str(output_dir / "website_results.png"))
            print(f"✓ Captured results section")
        except:
            pass

        driver.quit()
        return True

    except Exception as e:
        print(f"Screenshot capture failed: {e}")
        print("This is optional - PPT will use generated charts instead")
        return False

if __name__ == "__main__":
    capture_website_screenshots()
