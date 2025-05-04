document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('zmanim-container');
    const citySelect = document.getElementById('city-select');
    const locationSubtitle = document.getElementById('location-subtitle');

    if (!container || !citySelect || !locationSubtitle) {
        console.error('Required HTML elements not found');
        if (container) container.innerHTML = "<p style='color: red;'>Error: Page structure missing elements.</p>";
        return;
    }

    // --- Function to Fetch and Display Zmanim ---
    // Now accepts geonameid and timezone as parameters
    async function loadZmanim(geonameid, timeZoneId, cityName) {
        try {
            // Update subtitle
            locationSubtitle.textContent = `Daily Zmanim for ${cityName}`;
            container.innerHTML = `<p>Loading zmanim for ${cityName}...</p>`; // Update status

            // Calculate start and end dates (Today + 7 days = 8 days total)
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 7);

            // Format dates as YYYY-MM-DD for Hebcal API
            const formatDate = (date) => date.toISOString().split('T')[0];
            const startDateStr = formatDate(today);
            const endDateStr = formatDate(endDate);

            // Construct Hebcal API URL using selected geonameid
            // Requests JSON format, geonameid, start/end dates,
            // Ashkenazi transliterations (lg=s), Havdalah 50 min (m=50), turns off leyning
            // Use tzid for accuracy if available
            const hebcalURL = `https://www.hebcal.com/hebcal?v=1&cfg=json&geonameid=${geonameid}&start=${startDateStr}&end=${endDateStr}&lg=s&m=50&leyning=off&tzid=${timeZoneId}`;

            const response = await fetch(hebcalURL);
            if (!response.ok) {
                // Try fetching without tzid as a fallback for potentially unsupported IDs
                 const fallbackURL = `https://www.hebcal.com/hebcal?v=1&cfg=json&geonameid=${geonameid}&start=${startDateStr}&end=${endDateStr}&lg=s&m=50&leyning=off`;
                 console.warn(`Initial fetch failed with tzid=${timeZoneId}, trying fallback: ${fallbackURL}`);
                 const fallbackResponse = await fetch(fallbackURL);
                 if (!fallbackResponse.ok) {
                    throw new Error(`HTTP error! status: ${fallbackResponse.status} (also failed without timezone)`);
                 }
                 console.log("Fallback fetch successful.");
                 data = await fallbackResponse.json();

            } else {
                 data = await response.json();
            }


            if (!data || !data.items) {
                 throw new Error('Invalid data received from Hebcal API.');
            }

            // --- Process Hebcal Data ---
            const dailyData = {}; // Object to hold events/zmanim grouped by date YYYY-MM-DD

            data.items.forEach(item => {
                const itemDateStr = item.date.substring(0, 10);
                if (!dailyData[itemDateStr]) {
                    dailyData[itemDateStr] = { zmanim: [], events: [] };
                }

                if (item.category === 'zmanim') {
                     // Use specified timezone for time formatting
                    const time = new Date(item.date).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timeZoneId
                    });
                    dailyData[itemDateStr].zmanim.push({ name: item.title, time: time, dateObj: new Date(item.date) }); // Store Date object for sorting
                } else if (item.category === 'parashat' || item.category === 'holiday') {
                     let eventTitle = item.title;
                     if (item.hebrew) eventTitle += ` (${item.hebrew})`;
                     dailyData[itemDateStr].events.push(eventTitle);
                }
            });

            // Sort zmanim chronologically within each day
            for (const dateStr in dailyData) {
                dailyData[dateStr].zmanim.sort((a, b) => a.dateObj - b.dateObj);
            }

            // --- Display Processed Data ---
            container.innerHTML = ''; // Clear loading message

            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timeZoneId };

            for (let i = 0; i < 8; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                const currentDateStr = formatDate(currentDate);

                const dayDiv = document.createElement('div');
                dayDiv.className = 'day-zmanim';

                const dateHeading = document.createElement('h2');
                 // Display date using the location's timezone
                dateHeading.textContent = currentDate.toLocaleDateString('en-US', dateOptions);
                dayDiv.appendChild(dateHeading);

                // Display Events (Parsha/Holidays)
                if (dailyData[currentDateStr] && dailyData[currentDateStr].events.length > 0) {
                    const eventsP = document.createElement('p');
                    eventsP.style.fontWeight = 'bold';
                    eventsP.style.color = '#dc3545'; // Reddish color
                    eventsP.innerHTML = dailyData[currentDateStr].events.join('<br>');
                    dayDiv.appendChild(eventsP);
                }

                // Display Zmanim
                const zmanimList = document.createElement('ul');
                if (dailyData[currentDateStr] && dailyData[currentDateStr].zmanim.length > 0) {
                     const commonZmanimPrefixes = [ // Match start of Hebcal titles
                        "Alot haShachar", "Sunrise", "Sof Zman Shma", "Sof Zman Tfila",
                        "Chatzot", "Mincha Gedola", "Mincha Ketana", "Plag haMincha",
                        "Candle lighting", "Sunset", "Tz'et haKochavim"
                    ];
                    dailyData[currentDateStr].zmanim.forEach(zman => {
                         if (commonZmanimPrefixes.some(prefix => zman.name.startsWith(prefix))) {
                            const listItem = document.createElement('li');
                            listItem.innerHTML = `<strong>${zman.name}:</strong> <span>${zman.time}</span>`;
                            zmanimList.appendChild(listItem);
                         }
                    });
                     if (zmanimList.children.length === 0) { // Handle case where filtering removes all zmanim
                        const listItem = document.createElement('li');
                        listItem.textContent = 'No standard zmanim data found for this day.';
                        zmanimList.appendChild(listItem);
                     }
                } else {
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No zmanim data available for this day.';
                    zmanimList.appendChild(listItem);
                }
                dayDiv.appendChild(zmanimList);
                container.appendChild(dayDiv);
            }

        } catch (error) {
            console.error(`Error loading zmanim for ${cityName} (geonameid: ${geonameid}):`, error);
            container.innerHTML = `<p style="color: red;">Could not load Zmanim data for ${cityName}. Error: ${error.message}. Check the console (F12).</p>`;
             // Reset subtitle if loading fails
             locationSubtitle.textContent = `Daily Zmanim`;

        }
    }

    // --- Event Listener for Dropdown Change ---
    citySelect.addEventListener('change', (event) => {
        const selectedOption = event.target.selectedOptions[0];
        const geonameid = selectedOption.value;
        const cityName = selectedOption.text;
        const timeZoneId = selectedOption.dataset.tz; // Get timezone from data attribute
        if (geonameid && timeZoneId) {
            loadZmanim(geonameid, timeZoneId, cityName);
        } else {
             console.error("Selected option missing value or timezone data", selectedOption);
             container.innerHTML = "<p style='color: red;'>Error: Invalid location selected.</p>";
             locationSubtitle.textContent = `Daily Zmanim`;
        }
    });

    // --- Initial Load on Page Load ---
    // Trigger the 'change' event manually to load the default selected city
    citySelect.dispatchEvent(new Event('change'));

});
