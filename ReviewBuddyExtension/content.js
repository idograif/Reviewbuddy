console.log("Content script loaded - Log ID: 001");
let isMinimized = true;
let currentUrl = window.location.href;
let currentPlaceName = null;
let currentPlaceAddress = null;
let isDebugMode = true; // Set this to false to turn off logging

function log(message) {
  if (isDebugMode) {
    console.log(message);
  }
}

function getPlaceName() {
  const titleElement = document.querySelector('[data-attrid="title"]');
  if (titleElement) {
    const placeName = titleElement.innerText;
    log(`Place name found: ${placeName} - Log ID: 002`);
    return placeName;
  } else {
    log("Place name not found - Log ID: 003");
    return null;
  }
}

function getPlaceAddress() {
  const addressElement = document.querySelector(
    '[data-local-attribute="d3adr"]'
  );
  if (addressElement && addressElement.children.length > 1) {
    const address = addressElement.children[1].innerText;
    log(`Address found: ${address} - Log ID: 007`);
    return address;
  } else {
    log("Address not found or insufficient children - Log ID: 008");
    return null;
  }
}

async function fetchReviewModelScore(placeName, placeCity) {
  const apiUrl =
    "https://score-google-place-api-bnwzz3dieq-zf.a.run.app/predict_google_place?place_name=" +
    encodeURIComponent(`${placeName} ${placeCity}`) +
    "&number_of_reviews=10";

  showSkeletonLoader();

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log(`Received score: ${data.score} - Log ID: 017`);
    displayReviewModelScore(data.score);
  } catch (error) {
    log(`Failed to fetch review model score - Log ID: 018`, error);
  }
}

function showSkeletonLoader() {
  const reviewModelScoreContainer = document.getElementById("reviewModelScore");
  reviewModelScoreContainer.innerHTML = `
    <div class="skeleton-container">
    <div class="skeleton-rating">
      <div class="skeleton-glimmer"></div>
    </div>
      <div class="skeleton-stars">
        <div class="skeleton-glimmer"></div>
      </div>
    </div>
  `;
}

function displayReviewModelScore(score) {
  const reviewModelScoreContainer = document.getElementById("reviewModelScore");
  const starWidth = 23; // Width of one star
  const filledWidth = Math.floor(score) * starWidth + (score % 1) * starWidth;

  const starHtml = `
    <span class="stars" aria-label="Rated ${score} out of 5," role="img">
      <div aria-hidden="true">
        <span style="width:calc(${filledWidth}px)"></span>
      </div>
    </span>
  `;

  reviewModelScoreContainer.innerHTML = `<div>${score} ${starHtml}</div>`;
}

function injectHTML() {
  fetch(chrome.runtime.getURL("popup.html"))
    .then((response) => response.text())
    .then((data) => {
      const container = document.createElement("div");
      container.innerHTML = data;
      const parentDiv = document.getElementById("lu_pinned_rhs");
      if (parentDiv) {
        parentDiv.appendChild(container);
        log("HTML injected - Log ID: 011");
        initializePopup();
      } else {
        log("Parent div not found - Log ID: 012");
      }
    })
    .catch((err) => {
      log("Failed to fetch HTML - Log ID: 013", err);
    });
}

function initializePopup() {
  log("Initializing popup - Log ID: 020");
  updatePlaceInfo();

  document
    .getElementById("reviewBuddyMinimizeButton")
    .addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent the click event from bubbling up to the parent div
      document.getElementById("reviewBuddyContent").style.display = "none";
      document.getElementById("reviewBuddyMinimizeButton").style.display =
        "none";
      isMinimized = true;
      log("Minimized - Log ID: 015");
    });

  document
    .getElementById("reviewBuddyContainer")
    .addEventListener("click", () => {
      if (isMinimized) {
        document.getElementById("reviewBuddyContent").style.display = "block";
        document.getElementById("reviewBuddyMinimizeButton").style.display =
          "block";
        isMinimized = false;
        log("Maximized - Log ID: 016");
      }
    });

  // Initialize tooltips
  document.querySelectorAll(".info-icon").forEach((icon) => {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerText =
      "The rating is inferred using artificial intelligence reading over all of these reviews and giving a review based on the sentiment of the text, not by the stars they gave.";
    icon.appendChild(tooltip);
  });
}

function updatePlaceInfo() {
  log("Updating place info - Log ID: 021");
  const placeName = getPlaceName();
  const placeAddress = getPlaceAddress();

  if (placeName) {
    document.getElementById("placeName").innerText = placeName;
    log(`Place name displayed: ${placeName} - Log ID: 005`);
    currentPlaceName = placeName;
  } else {
    document.getElementById("placeName").innerText = "Place name not found.";
    log("Failed to display place name - Log ID: 006");
  }

  if (placeAddress) {
    document.getElementById("placeAddress").innerText = placeAddress;
    log(`Address displayed: ${placeAddress} - Log ID: 009`);
    currentPlaceAddress = placeAddress;
    const placeCity = placeAddress.split(",")[1].trim();
    fetchReviewModelScore(placeName, placeCity);
  } else {
    document.getElementById("placeAddress").innerText = "Address not found.";
    log("Failed to display address - Log ID: 010");
  }
}

function waitForElements() {
  log("Waiting for elements - Log ID: 022");
  const observer = new MutationObserver((mutations, obs) => {
    const titleElement = document.querySelector('[data-attrid="title"]');
    const addressElement = document.querySelector(
      '[data-local-attribute="d3adr"]'
    );
    if (titleElement && addressElement && addressElement.children.length > 1) {
      log("Required elements found - Log ID: 014");
      injectHTML();
      obs.disconnect();
      observePlaceChanges();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

function observePlaceChanges() {
  log("Observing place changes - Log ID: 023");
  const titleElement = document.querySelector('[data-attrid="title"]');
  const addressElement = document.querySelector(
    '[data-local-attribute="d3adr"]'
  );

  const observer = new MutationObserver((mutations) => {
    log("Place information changed - Log ID: 019");
    mutations.forEach((mutation) => {
      log(`Mutation detected: ${mutation.type} - Log ID: 026`);
    });
    updatePlaceInfo();
  });

  if (titleElement) {
    observer.observe(titleElement, { childList: true, subtree: true });
    log("Observing title element - Log ID: 024");
  }

  if (addressElement) {
    observer.observe(addressElement, { childList: true, subtree: true });
    log("Observing address element - Log ID: 025");
  }
}

function detectUrlChange() {
  setInterval(() => {
    if (currentUrl !== window.location.href) {
      log(
        `URL changed from ${currentUrl} to ${window.location.href} - Log ID: 027`
      );
      currentUrl = window.location.href;
      retryUpdatePlaceInfo();
    }
  }, 1000);
}

function retryUpdatePlaceInfo(retries = 5) {
  log(`Retrying update place info, attempts left: ${retries} - Log ID: 028`);
  if (retries <= 0) {
    log("Max retries reached, stopping retry - Log ID: 029");
    return;
  }

  const titleElement = document.querySelector('[data-attrid="title"]');
  const addressElement = document.querySelector(
    '[data-local-attribute="d3adr"]'
  );

  if (titleElement && addressElement && addressElement.children.length > 1) {
    const newPlaceName = titleElement.innerText;
    const newPlaceAddress = addressElement.children[1].innerText;

    if (
      newPlaceName !== currentPlaceName ||
      newPlaceAddress !== currentPlaceAddress
    ) {
      log(
        `New place detected: ${newPlaceName}, ${newPlaceAddress} - Log ID: 030`
      );
      updatePlaceInfo();
    } else {
      log(`Place info not changed yet, retrying... - Log ID: 031`);
      setTimeout(() => retryUpdatePlaceInfo(retries - 1), 1000);
    }
  } else {
    setTimeout(() => retryUpdatePlaceInfo(retries - 1), 1000);
  }
}

waitForElements();
detectUrlChange();
