document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('zmanim-container');
    const citySelect = document.getElementById('city-select');
    const locationSubtitle = document.getElementById('location-subtitle');

    if (!container || !citySelect || !locationSubtitle) {
        console.error('Required HTML elements not found');
        if (container) container.innerHTML = "<p style='color: red;'>Error: Page structure missing elements.</p>";
        return;
    }

    async function loadZmanim(geonameid, timeZoneId, cityName) {
        try {
            locationSubtitle.textContent = `Daily Zmanim for ${cityName}`;
            container.innerHTML = `<p>Loading zmanim for ${cityName}...</p>`;
            console.log(`Attempting to load zmanim for: ${cityName} (geonameid: ${geonameid}, tzid: ${timeZoneId})`);

            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 7);
            const formatDate = (date) => date.toISOString().split('T')[0];
            const startDateStr = formatDate(today);
            const endDateStr = formatDate(endDate);

            const hebcalURL = `https://www.hebcal.com/hebcal?v=1&cfg=json&geonameid=${geonameid}&start=${startDateStr}&end=${endDateStr}&lg=s&m=50&leyning=off&tzid=${timeZoneId}`;
            console.log("Calling Hebcal API URL:", hebcalURL); // Log the URL

            let response;
            let data;
            try {
                 response = await fetch(hebcalURL);
                 if (!response.ok) {
                    console.warn(`Initial fetch failed with status ${response.status} for URL: ${hebcalURL}. Trying fallback without tzid.`);
                    const fallbackURL = `https://www.hebcal.com/hebcal?v=1&cfg=json&geonameid=${geonameid}&start=${startDateStr}&end=${endDateStr}&lg=s&m=50&leyning=off`;
                    console.log("Calling Hebcal API Fallback URL:", fallbackURL); // Log Fallback URL
                    response = await fetch(fallbackURL); // Assign to response to check ok status below
                     if (!response.ok) {
                         throw new Error(`HTTP error! Fallback also failed with status: ${response.status}`);
                     }
                     console.log("Fallback fetch successful.");
                 }
                 data = await response.json();

            } catch(fetchError) {
                 console.error("Fetch failed:", fetchError);
                 throw fetchError; // Re-throw to be caught by outer catch block
            }


            console.log("Raw data received from Hebcal:", JSON.stringify(data, null, 2)); // Log the raw response

            if (!data || !data.items) {
                 console.error("Invalid or empty data received from Hebcal API.");
                 throw new Error('Invalid data received from Hebcal API.');
            }

            const dailyData = {};
            console.log("Processing Hebcal items...");
            data.items.forEach((item, index) => {
                // console.log(`Item ${index}:`, JSON.stringify(item)); // Optional: Log every single item if needed
                const itemDateStr = item.date.substring(0, 10);
                if (!dailyData[itemDateStr]) {
                    dailyData[itemDateStr] = { zmanim: [], events: [] };
                }

                if (item.category === 'zmanim') {
                    const time = new Date(item.date).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timeZoneId
                    });
                    dailyData[itemDateStr].zmanim.push({ name: item.title, time: time, dateObj: new Date(item.date) });
                } else if (item.category === 'parashat' || item.category === 'holiday') {
                     let eventTitle = item.title;
                     if (item.hebrew) eventTitle += ` (${item.hebrew})`;
                     dailyData[itemDateStr].events.push(eventTitle);
                }
            });
            console.log("Processed daily data structure:", JSON.stringify(dailyData, null, 2)); // Log the processed structure

            // Sort zmanim chronologically within each day
            for (const dateStr in dailyData) {
                dailyData[dateStr].zmanim.sort((a, b) => a.dateObj - b.dateObj);
            }
            console.log("Sorted daily data structure:", JSON.stringify(dailyData, null, 2)); // Log after sorting


            container.innerHTML = '';
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timeZoneId };
            console.log("Displaying data for 8 days...");

            for (let i = 0; i < 8; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                const currentDateStr = formatDate(currentDate);
                // console.log(`Checking display for date: ${currentDateStr}`); // Optional: Log date being displayed

                const dayDiv = document.createElement('div');
                dayDiv.className = 'day-zmanim';
                const dateHeading = document.createElement('h2');
                dateHeading.textContent = currentDate.toLocaleDateString('en-US', dateOptions);
                dayDiv.appendChild(dateHeading);

                if (dailyData[currentDateStr] && dailyData[currentDateStr].events.length > 0) {
                    const eventsP = document.createElement('p');
                    eventsP.style.fontWeight = 'bold';
                    eventsP.style.color = '#dc3545';
                    eventsP.innerHTML = dailyData[currentDateStr].events.join('<br>');
                    dayDiv.appendChild(eventsP);
                }

                const zmanimList = document.createElement('ul');
                let zmanimFoundForDay = false; // Flag to track if we add any zmanim LI elements
                if (dailyData[currentDateStr] && dailyData[currentDateStr].zmanim.length > 0) {
                     const commonZmanimPrefixes = [
                        "Alot haShachar", "Sunrise", "Sof Zman Shma", "Sof Zman Tfila",
                        "Chatzot", "Mincha Gedola", "Mincha Ketana", "Plag haMincha",
                        "Candle lighting", "Sunset", "Tz'et haKochavim"
                    ];
                     // console.log(`Processing ${dailyData[currentDateStr].zmanim.length} zmanim for ${currentDateStr}`); // Optional
                    dailyData[currentDateStr].zmanim.forEach(zman => {
                         // console.log(` -- Checking zman: ${zman.name}`); // Optional
                         if (commonZmanimPrefixes.some(prefix => zman.name.startsWith(prefix))) {
                            // console.log(`    -- Displaying: ${zman.name}`); // Optional
                            const listItem = document.createElement('li');
                            listItem.innerHTML = `<strong>${zman.name}:</strong> <span>${zman.time}</span>`;
                            zmanimList.appendChild(listItem);
                            zmanimFoundForDay = true; // Mark that we found at least one zman
                         } else {
                            // console.log(`    -- Skipping (filter): ${zman.name}`); // Optional
                         }
                    });
                }

                // If NO zmanim were added to the list (either none existed or all were filtered out)
                if (!zmanimFoundForDay) {
                    // console.log(`No displayable zmanim found for ${currentDateStr}, adding 'No data' message.`); // Optional
                    const listItem = document.createElement('li');
                    const reason = (dailyData[currentDateStr] && dailyData[currentDateStr].zmanim.length > 0)
                        ? ' (filtered)' // Some zmanim existed but were filtered out
                        : ''; // No zmanim found at all for this date in the data
                    listItem.textContent = `No standard zmanim data available for this day${reason}.`;
                    zmanimList.appendChild(listItem);
                }

                dayDiv.appendChild(zmanimList);
                container.appendChild(dayDiv);
            }
            console.log("Display update complete.");

        } catch (error) {
            console.error(`Error loading zmanim for ${cityName} (geonameid: ${geonameid}):`, error);
            container.innerHTML = `<p style="color: red;">Could not load Zmanim data for ${cityName}. Error: ${error.message}. Check the console (F12).</p>`;
            locationSubtitle.textContent = `Daily Zmanim`;
        }
    }

    citySelect.addEventListener('change', (event) => {
        const selectedOption = event.target.selectedOptions[0];
        const geonameid = selectedOption.value;
        const cityName = selectedOption.text;
        const timeZoneId = selectedOption.dataset.tz;
        if (geonameid && timeZoneId) {
            loadZmanim(geonameid, timeZoneId, cityName);
        } else {
             console.error("Selected option missing value or timezone data", selectedOption);
             container.innerHTML = "<p style='color: red;'>Error: Invalid location selected.</p>";
             locationSubtitle.textContent = `Daily Zmanim`;
        }
    });

    // Initial Load
    console.log("Initial page load: Triggering data load for default city.");
    citySelect.dispatchEvent(new Event('change'));
});
