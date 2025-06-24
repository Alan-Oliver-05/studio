# How to Get API Keys for the Research Agent

To enable the Research Agent's real-time web search capabilities, you need to provide two keys from the Google Cloud Platform: an **API Key** and a **Programmable Search Engine ID**.

Follow these steps carefully.

---

### Step 1: Create a Google Cloud Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  If you don't have a project, create one. Click on the project dropdown at the top of the page and click **"New Project"**.
3.  Give your project a name (e.g., "AI-Tutor-Keys") and click **"Create"**.

---

### Step 2: Get a Google API Key

This key allows your application to authenticate with Google's APIs.

1.  In your Google Cloud Project, navigate to **"APIs & Services" > "Credentials"** from the left-hand menu.
2.  Click on **"+ CREATE CREDENTIALS"** at the top of the page.
3.  Select **"API key"** from the dropdown menu.
4.  A new API key will be created. Click the copy icon to copy it.
5.  **Important Security Step:** For security, it's highly recommended to restrict your key. Click **"Edit API key"** and under "API restrictions", select "Restrict key". From the dropdown, select the **"Custom Search API"**. This ensures the key can only be used for searching.
6.  Paste this key into the `.env` file in your project for the `GOOGLE_API_KEY` variable.

    ```env
    GOOGLE_API_KEY="YOUR_API_KEY_HERE"
    ```

---

### Step 3: Get a Programmable Search Engine ID (CSE ID)

This ID tells Google *what* to search. You will configure a search engine to search the entire web.

1.  Go to the [Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  Click **"Add"** to create a new search engine.
3.  In the **"What to search?"** section:
    *   Turn **ON** the option for **"Search the entire web"**.
    *   You can give the search engine a name, like "AI-Tutor-Web-Search".
4.  Complete the setup. You will be taken to a "Congratulations" page.
5.  On the main setup page for your new search engine, you will find the **"Search engine ID"**. Click the **"Copy to clipboard"** button.
6.  Paste this ID into the `.env` file in your project for the `GOOGLE_CSE_ID` variable.

    ```env
    GOOGLE_CSE_ID="YOUR_SEARCH_ENGINE_ID_HERE"
    ```

---

### Step 4: **(CRITICAL)** Enable the Custom Search API

You must enable the API for your project so your API key can use it. **This is the most common reason for "blocked" requests.**

1.  Go to the [Google Cloud API Library](https://console.cloud.google.com/apis/library).
2.  Make sure you have selected the correct Google Cloud Project at the top of the page.
3.  Search for **"Custom Search API"**.
4.  Click on it and then click the **"Enable"** button. If it's already enabled, you're all set.

---

Once you have completed all these steps and added both keys to your `.env` file, the Research Agent feature will be fully functional.
